const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * 폴더명이 학수번호 형식인지 확인
 * 학수번호 형식: 영문자로 시작하고 숫자로 끝나는 형태, 하이픈 없음
 * 예: COSE28100, SPGE17601 ✓
 * 예: 공학수학_이종실, COSE281-02 ✗
 */
function isCourseIdFormat(folderName) {
  // 영문자로 시작하고 숫자로 끝나는 형태, 하이픈 없음
  const courseIdPattern = /^[A-Z]+\d+$/;
  return courseIdPattern.test(folderName);
}

/**
 * syllabus 파일명에서 학수번호 추출
 * 예: COSE281-02.txt → COSE28102
 */
function extractCourseIdFromFilename(filename) {
  // .txt 확장자 제거
  const nameWithoutExt = filename.replace(/\.txt$/, '');
  
  // 하이픈이 있으면 제거
  const courseId = nameWithoutExt.replace(/-/g, '');
  
  // 학수번호 형식인지 확인
  if (isCourseIdFormat(courseId)) {
    return courseId;
  }
  
  return null;
}

/**
 * syllabus 파일 내용에서 학수번호 추출
 * 예: "과목코드: COSE281 (02)" → COSE28102
 */
function extractCourseIdFromContent(content) {
  // 여러 패턴 시도
  const patterns = [
    /과목코드:\s*([A-Z]+\d+)\s*\((\d+)\)/,  // "과목코드: COSE281 (02)"
    /과목코드:\s*([A-Z]+\d+)/,              // "과목코드: COSE281"
    /([A-Z]+\d+)\s*\((\d+)\)/,              // "COSE281 (02)"
    /([A-Z]+\d+)/,                          // "COSE281"
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      let courseId;
      if (match[2]) {
        // 괄호 안의 숫자가 있으면 합치기 (예: COSE281 (02) → COSE28102)
        courseId = match[1] + match[2];
      } else {
        courseId = match[1];
      }
      
      // 학수번호 형식인지 확인
      if (isCourseIdFormat(courseId)) {
        return courseId;
      }
    }
  }

  return null;
}

/**
 * syllabus 폴더에서 학수번호 추출
 */
function extractCourseIdFromSyllabus(folderPath) {
  const syllabusPath = path.join(folderPath, 'syllabus');
  
  if (!fs.existsSync(syllabusPath)) {
    return null;
  }

  const files = fs.readdirSync(syllabusPath);
  const txtFiles = files.filter((file) => file.endsWith('.txt'));

  if (txtFiles.length === 0) {
    return null;
  }

  // 첫 번째 파일에서 추출 시도
  for (const file of txtFiles) {
    // 1. 파일명에서 추출
    const courseIdFromFilename = extractCourseIdFromFilename(file);
    if (courseIdFromFilename) {
      return courseIdFromFilename;
    }

    // 2. 파일 내용에서 추출
    try {
      const filePath = path.join(syllabusPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const courseIdFromContent = extractCourseIdFromContent(content);
      if (courseIdFromContent) {
        return courseIdFromContent;
      }
    } catch (error) {
      console.warn(`Error reading ${filePath}:`, error.message);
    }
  }

  return null;
}

/**
 * 디렉토리 내의 모든 파일과 폴더를 재귀적으로 복사
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      // 파일명 충돌 처리: 이미 존재하면 원본 폴더명을 접두사로 추가
      let finalDestPath = destPath;
      if (fs.existsSync(destPath)) {
        const srcDirName = path.basename(src);
        const ext = path.extname(entry.name);
        const nameWithoutExt = path.basename(entry.name, ext);
        finalDestPath = path.join(
          path.dirname(destPath),
          `${srcDirName}_${nameWithoutExt}${ext}`,
        );
      }
      fs.copyFileSync(srcPath, finalDestPath);
      console.log(`  Copied: ${entry.name} -> ${path.relative(DATA_DIR, finalDestPath)}`);
    }
  }
}

/**
 * 메인 함수
 */
function main() {
  console.log('Starting folder move by course ID from syllabus...\n');

  // 1. data 폴더 내 모든 디렉토리 스캔
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory());

  console.log(`Found ${folders.length} folders\n`);

  // 2. 학수번호 형식이 아닌 폴더들 필터링
  const nonCourseIdFolders = folders.filter(
    (folder) => !isCourseIdFormat(folder.name),
  );

  console.log(`Found ${nonCourseIdFolders.length} non-course-id folders\n`);

  // 3. 각 폴더에서 syllabus를 통해 학수번호 추출
  const foldersToMove = [];

  for (const folder of nonCourseIdFolders) {
    const folderPath = path.join(DATA_DIR, folder.name);
    const courseId = extractCourseIdFromSyllabus(folderPath);

    if (courseId) {
      foldersToMove.push({
        folderName: folder.name,
        folderPath: folderPath,
        courseId: courseId,
      });
      console.log(`Found course ID for ${folder.name}: ${courseId}`);
    } else {
      console.warn(`Warning: Could not extract course ID from ${folder.name}`);
    }
  }

  console.log(`\nFound ${foldersToMove.length} folders to move\n`);

  // 4. 폴더 이동/병합
  for (const item of foldersToMove) {
    const targetPath = path.join(DATA_DIR, item.courseId);

    if (fs.existsSync(targetPath)) {
      // 타겟 폴더가 이미 존재하면 병합
      console.log(`\nMerging: ${item.folderName} -> ${item.courseId}`);
      copyDirectory(item.folderPath, targetPath);
      
      // 기존 폴더 삭제
      try {
        fs.rmSync(item.folderPath, { recursive: true, force: true });
        console.log(`  Deleted: ${item.folderName}`);
      } catch (error) {
        console.error(`  Error deleting ${item.folderPath}:`, error.message);
      }
    } else {
      // 타겟 폴더가 없으면 이름 변경
      console.log(`\nRenaming: ${item.folderName} -> ${item.courseId}`);
      try {
        fs.renameSync(item.folderPath, targetPath);
        console.log(`  Renamed successfully`);
      } catch (error) {
        console.error(`  Error renaming ${item.folderPath}:`, error.message);
      }
    }
  }

  console.log('\n✅ Folder move completed!');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };

