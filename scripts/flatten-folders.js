const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

/**
 * 폴더명이 학수번호 형식인지 확인
 */
function isCourseIdFormat(folderName) {
  const courseIdPattern = /^[A-Z]+\d+$/;
  return courseIdPattern.test(folderName);
}

/**
 * 디렉토리가 비어있는지 확인 (하위 디렉토리와 파일 모두 없음)
 */
function isEmptyDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries.length === 0;
  } catch (error) {
    return false;
  }
}

/**
 * 하위 폴더의 모든 파일을 상위 폴더로 이동
 */
function moveFilesFromSubfolder(parentDir, subfolderName) {
  const subfolderPath = path.join(parentDir, subfolderName);

  if (!fs.existsSync(subfolderPath)) {
    return;
  }

  const entries = fs.readdirSync(subfolderPath, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile());

  for (const file of files) {
    const srcPath = path.join(subfolderPath, file.name);
    let destPath = path.join(parentDir, file.name);

    // 파일명 충돌 처리: 상위 폴더에 같은 이름의 파일이 있으면 하위 폴더명을 접두사로 추가
    if (fs.existsSync(destPath)) {
      const ext = path.extname(file.name);
      const nameWithoutExt = path.basename(file.name, ext);
      destPath = path.join(parentDir, `${subfolderName}_${nameWithoutExt}${ext}`);
    }

    try {
      fs.renameSync(srcPath, destPath);
      console.log(`  Moved: ${subfolderName}/${file.name} -> ${path.basename(destPath)}`);
    } catch (error) {
      console.error(`  Error moving ${srcPath}:`, error.message);
    }
  }
}

/**
 * 하나의 학수번호 폴더를 평탄화
 */
function flattenCourseFolder(courseFolderPath) {
  const folderName = path.basename(courseFolderPath);
  const entries = fs.readdirSync(courseFolderPath, { withFileTypes: true });
  const subfolders = entries.filter((entry) => entry.isDirectory());

  if (subfolders.length === 0) {
    return; // 하위 폴더가 없으면 스킵
  }

  console.log(`\nProcessing: ${folderName}`);

  // 각 하위 폴더의 파일을 상위로 이동
  for (const subfolder of subfolders) {
    moveFilesFromSubfolder(courseFolderPath, subfolder.name);
  }

  // 빈 하위 폴더 삭제
  for (const subfolder of subfolders) {
    const subfolderPath = path.join(courseFolderPath, subfolder.name);
    if (isEmptyDirectory(subfolderPath)) {
      try {
        fs.rmdirSync(subfolderPath);
        console.log(`  Deleted empty folder: ${subfolder.name}`);
      } catch (error) {
        console.error(`  Error deleting ${subfolderPath}:`, error.message);
      }
    } else {
      // 재귀적으로 하위 폴더 내부도 확인 (중첩된 폴더가 있을 수 있음)
      const remainingEntries = fs.readdirSync(subfolderPath, {
        withFileTypes: true,
      });
      if (remainingEntries.length === 0) {
        try {
          fs.rmdirSync(subfolderPath);
          console.log(`  Deleted empty folder: ${subfolder.name}`);
        } catch (error) {
          console.error(`  Error deleting ${subfolderPath}:`, error.message);
        }
      }
    }
  }
}

/**
 * 메인 함수
 */
function main() {
  console.log('Starting folder flattening...\n');

  // 1. data 폴더 내 모든 디렉토리 스캔
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  const folders = entries.filter((entry) => entry.isDirectory());

  console.log(`Found ${folders.length} folders\n`);

  // 2. 학수번호 형식인 폴더들만 필터링
  const courseIdFolders = folders.filter((folder) =>
    isCourseIdFormat(folder.name),
  );

  console.log(`Found ${courseIdFolders.length} course ID folders\n`);

  // 3. 각 폴더를 평탄화
  let processedCount = 0;
  for (const folder of courseIdFolders) {
    const folderPath = path.join(DATA_DIR, folder.name);
    flattenCourseFolder(folderPath);
    processedCount++;
  }

  console.log(`\n✅ Processed ${processedCount} folders!`);
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { main };

