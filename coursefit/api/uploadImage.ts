// api/uploadImage.ts


// 서버로부터 받을 추천과목 타입 정의
export interface SubjectItem {
  courseId: string;
  title: string;
  reason: string;
  similarity: number;
}

export interface PostImageResponse {
  recommendations: Array<{  // subjects → recommendations
    courseId: string;
    title: string;
    reason: string;
    similarity: number;
    metadata?: Record<string, any>;
  }>;
}

// 실제 이미지 파일을 업로드하는 함수
export async function postImageFile(file: File): Promise<PostImageResponse> {
  const formData = new FormData();
  formData.append("image", file); // 서버에서 image라는 키로 받아야 함

  // apiClient를 직접 쓰지 않고 fetch를 바로 사용해야 boundary 문제가 안 생깁니다!
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/recommend/course/upload`,
    {
      method: "POST",
      body: formData, // Content-Type은 X
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "API Error");
  }
  return res.json();
}
