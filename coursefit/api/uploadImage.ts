import { apiClient } from "./client";

export interface PostImagePayload {
  imageurl: string;
}

export interface SubjectItem {
  title: string;
  description: string;
}

export interface PostImageResponse {
  subjects: SubjectItem[];
}

export async function postImage(
  data: PostImagePayload
): Promise<PostImageResponse> {
  return apiClient<PostImageResponse>("/imagePost", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
