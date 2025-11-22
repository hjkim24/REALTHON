const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * course_profile.txt 파일에서 Course ID 추출
 */
function extractCourseId(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/Course ID:\s*(\S+)/);
    return match ? match[1].trim() : null;
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
  console.log('Starting course folder merge by Course ID...\n');

  // 1. data 폴더 내 모든 디렉토리 스캔
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const courseFolders = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== '교양' && entry.name !== '전공',
  );

  console.log(`Found ${courseFolders.length} course folders\n`);

  // 2. Course ID 추출 및 그룹화
  const courseIdMap = new Map(); // courseId -> [folder paths]

  for (const folder of courseFolders) {
    const folderPath = path.join(DATA_DIR, folder.name);
    const profilePath = path.join(folderPath, 'course_profile.txt');

    if (!fs.existsSync(profilePath)) {
      console.warn(`Warning: No course_profile.txt in ${folder.name}, skipping...`);
      continue;
    }

    const courseId = extractCourseId(profilePath);
    if (!courseId) {
      console.warn(`Warning: Could not extract Course ID from ${folder.name}, skipping...`);
      continue;
    }

    if (!courseIdMap.has(courseId)) {
      courseIdMap.set(courseId, []);
    }
    courseIdMap.get(courseId).push({
      folderName: folder.name,
      folderPath: folderPath,
    });
  }

  console.log(`Found ${courseIdMap.size} unique Course IDs\n`);

  // 3. 같은 Course ID를 가진 폴더들 병합
  const mergedFolders = [];
  const foldersToDelete = [];

  for (const [courseId, folders] of courseIdMap.entries()) {
    if (folders.length === 1) {
      // Course ID가 하나만 있으면 이름만 변경
      const folder = folders[0];
      if (folder.folderName !== courseId) {
        const newPath = path.join(DATA_DIR, courseId);
        if (fs.existsSync(newPath)) {
          console.log(`Folder ${courseId} already exists, skipping rename...`);
        } else {
          fs.renameSync(folder.folderPath, newPath);
          console.log(`Renamed: ${folder.folderName} -> ${courseId}`);
        }
      }
      continue;
    }

    // 여러 폴더가 있으면 병합
    console.log(`\nMerging ${folders.length} folders for Course ID: ${courseId}`);
    const targetPath = path.join(DATA_DIR, courseId);

    // 첫 번째 폴더를 타겟으로 사용 (이미 courseId 이름이면 그대로, 아니면 생성)
    let targetExists = false;
    if (fs.existsSync(targetPath)) {
      targetExists = true;
      console.log(`  Target folder ${courseId} already exists, merging into it...`);
    } else {
      // 첫 번째 폴더를 타겟으로 사용
      fs.renameSync(folders[0].folderPath, targetPath);
      console.log(`  Created target folder: ${courseId} (from ${folders[0].folderName})`);
      foldersToDelete.push(folders[0].folderPath);
    }

    // 나머지 폴더들의 내용을 타겟 폴더로 복사
    for (let i = targetExists ? 0 : 1; i < folders.length; i++) {
      const folder = folders[i];
      console.log(`  Merging: ${folder.folderName} -> ${courseId}`);
      copyDirectory(folder.folderPath, targetPath);
      foldersToDelete.push(folder.folderPath);
    }
  }

  // 4. 기존 폴더 삭제
  console.log('\n\nDeleting merged folders...');
  for (const folderPath of foldersToDelete) {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      console.log(`  Deleted: ${path.basename(folderPath)}`);
    } catch (error) {
      console.error(`  Error deleting ${folderPath}:`, error.message);
    }
  }

  console.log('\n✅ Course folder merge completed!');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };

