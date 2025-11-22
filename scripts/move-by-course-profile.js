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
 * course_profile.txt 파일에서 Course ID 추출
 */
function extractCourseIdFromProfile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/Course ID:\s*(\S+)/);
    if (match && match[1]) {
      const courseId = match[1].trim();
      // 학수번호 형식인지 확인
      if (isCourseIdFormat(courseId)) {
        return courseId;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
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
  console.log('Starting folder move by Course ID from course_profile.txt...\n');

  // 1. data 폴더 내 모든 디렉토리 스캔
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory());

  console.log(`Found ${folders.length} folders\n`);

  // 2. 학수번호 형식이 아닌 폴더들 필터링
  const nonCourseIdFolders = folders.filter(
    (folder) => !isCourseIdFormat(folder.name),
  );

  console.log(`Found ${nonCourseIdFolders.length} non-course-id folders\n`);

  // 3. 각 폴더에서 course_profile.txt를 통해 Course ID 추출
  const foldersToMove = [];

  for (const folder of nonCourseIdFolders) {
    const folderPath = path.join(DATA_DIR, folder.name);
    const profilePath = path.join(folderPath, 'course_profile.txt');

    if (!fs.existsSync(profilePath)) {
      console.warn(`Warning: No course_profile.txt in ${folder.name}, skipping...`);
      continue;
    }

    const courseId = extractCourseIdFromProfile(profilePath);

    if (courseId) {
      foldersToMove.push({
        folderName: folder.name,
        folderPath: folderPath,
        courseId: courseId,
      });
      console.log(`Found course ID for ${folder.name}: ${courseId}`);
    } else {
      console.warn(`Warning: Could not extract valid course ID from ${folder.name}`);
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

