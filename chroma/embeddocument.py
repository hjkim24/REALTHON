"""
Process document folder structure and save embeddings to vector database.
Preserves the folder hierarchy: course_name -> review/syllabus/course_id
"""
import os
import re
from typing import List, Dict, Any
from pathlib import Path
from pypdf import PdfReader
from embeddings import embedding
from vectordb import add_documents_to_vectordb


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from a PDF file."""
    pdf_file = Path(pdf_path)
    
    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")
    
    if not pdf_file.suffix.lower() == '.pdf':
        raise ValueError(f"File is not a PDF: {pdf_path}")
    
    try:
        reader = PdfReader(pdf_path)
        content_parts = []
        
        for page_num, page in enumerate(reader.pages, 1):
            try:
                page_text = page.extract_text()
                if page_text:
                    content_parts.append(page_text)
            except Exception as e:
                print(f"Warning: Could not extract text from page {page_num}: {e}")
                continue
        
        full_text = "\n".join(content_parts).strip()
        
        if not full_text:
            raise ValueError(f"No text could be extracted from PDF: {pdf_path}")
        
        return full_text
        
    except Exception as e:
        raise Exception(f"Error reading PDF {pdf_path}: {e}")


def read_text_file(file_path: Path) -> str:
    """Read text from a .txt file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read().strip()
    except Exception as e:
        raise Exception(f"Error reading text file {file_path}: {e}")


def process_document_folder(
    document_folder: str = "document",
    model: str = "text-embedding-ada-002",
    persist_directory: str = "./chroma_db"
) -> None:
    """
    Process all files in the document folder structure and save to vector database.
    Combines all reviews and syllabi for each course into one document per course.
    Creates a single "courses" collection with one embedding per course ID.
    Includes course_profile.txt content in embedding generation for context.
    
    Args:
        document_folder: Path to the document folder (default: "document")
        model: The embedding model to use (default: "text-embedding-ada-002")
        persist_directory: Directory to persist ChromaDB (default: "./chroma_db")
    
    Structure processed:
        document/
          {course_id}/  (folder name IS the course ID, e.g., COSE33100)
            reviews/
              {file}.txt (all combined)
            syllabus/
              {file}.txt or .pdf (all combined)
            course_profile.txt  (included in combined content, contains Course ID and Course Name)
    
    Each course ID gets one embedding that combines:
        - Course profile (includes Course ID and Course Name)
        - All reviews (combined)
        - All syllabi (combined)
    
    Document ID in ChromaDB is the course_id (one embedding per course ID).
    """
    doc_path = Path(document_folder)
    
    if not doc_path.exists():
        raise FileNotFoundError(f"Document folder '{document_folder}' not found")
    
    if not doc_path.is_dir():
        raise NotADirectoryError(f"'{document_folder}' is not a directory")
    
    # Get all course folders
    course_folders = [d for d in doc_path.iterdir() if d.is_dir()]
    
    if not course_folders:
        print(f"No course folders found in '{document_folder}'")
        return
    
    print(f"Found {len(course_folders)} course folder(s)")
    print("=" * 60)
    
    # Lists for combined course documents (one per course)
    course_texts = []
    course_embeddings = []
    course_metadatas = []
    course_ids = []
    
    for course_folder in course_folders:
        # Folder name IS the course ID
        course_id = course_folder.name
        print(f"\nProcessing course: {course_id}")
        
        # Read course_profile.txt for context
        course_profile_file = course_folder / "course_profile.txt"
        course_profile = ""
        course_name = ""
        if course_profile_file.exists():
            try:
                course_profile = read_text_file(course_profile_file)
                if course_profile:
                    print(f"  Found course profile ({len(course_profile)} characters)")
                    # Extract Course Name from course_profile.txt
                    course_name_match = re.search(r'Course Name:\s*([^\n]+)', course_profile)
                    if course_name_match:
                        course_name = course_name_match.group(1).strip()
                        print(f"  Found Course Name: {course_name}")
                    
                    # Verify Course ID matches folder name
                    course_id_match = re.search(r'Course ID:\s*([^\n]+)', course_profile)
                    if course_id_match:
                        profile_course_id = course_id_match.group(1).strip()
                        if profile_course_id != course_id:
                            print(f"    Warning: Course ID mismatch! Folder: {course_id}, Profile: {profile_course_id}")
            except Exception as e:
                print(f"    Warning: Could not read course_profile.txt: {e}")
        
        # Collect all reviews for this course
        all_reviews = []
        reviews_folder = course_folder / "reviews"
        if reviews_folder.exists() and reviews_folder.is_dir():
            review_files = list(reviews_folder.glob("*.txt"))
            for review_file in review_files:
                try:
                    print(f"  Reading review: {review_file.name}")
                    content = read_text_file(review_file)
                    
                    if content:
                        all_reviews.append(content)
                    else:
                        print(f"    Warning: Skipping empty file: {review_file.name}")
                    
                except Exception as e:
                    print(f"    Error reading {review_file.name}: {e}")
        
        # Collect all syllabi for this course
        all_syllabi = []
        syllabus_folder = course_folder / "syllabus"
        if syllabus_folder.exists() and syllabus_folder.is_dir():
            syllabus_files = list(syllabus_folder.glob("*.*"))
            for syllabus_file in syllabus_files:
                try:
                    print(f"  Reading syllabus: {syllabus_file.name}")
                    
                    # Extract text based on file type
                    if syllabus_file.suffix.lower() == '.pdf':
                        content = extract_text_from_pdf(str(syllabus_file))
                    else:  # .txt
                        content = read_text_file(syllabus_file)
                    
                    if content:
                        all_syllabi.append(content)
                    else:
                        print(f"    Warning: Skipping empty file: {syllabus_file.name}")
                    
                except Exception as e:
                    print(f"    Error reading {syllabus_file.name}: {e}")
        
        # Combine all content: course profile + all reviews + all syllabi
        combined_parts = []
        
        if course_profile:
            combined_parts.append(f"Course Profile:\n{course_profile}")
        
        if all_reviews:
            reviews_text = "\n\n".join([f"Review {i+1}:\n{review}" for i, review in enumerate(all_reviews)])
            combined_parts.append(f"\n\nReviews:\n{reviews_text}")
        
        if all_syllabi:
            syllabi_text = "\n\n".join([f"Syllabus {i+1}:\n{syllabus}" for i, syllabus in enumerate(all_syllabi)])
            combined_parts.append(f"\n\nSyllabi:\n{syllabi_text}")
        
        if not combined_parts:
            print(f"    Warning: No content found for course {course_id}, skipping...")
            continue
        
        # Combine all parts into one document
        combined_content = "\n".join(combined_parts)
        
        print(f"  Combined content: {len(combined_content)} characters")
        print(f"    - Course profile: {'Yes' if course_profile else 'No'}")
        print(f"    - Reviews: {len(all_reviews)} file(s)")
        print(f"    - Syllabi: {len(all_syllabi)} file(s)")
        
        # Generate embedding for the combined content
        embedding_vector = embedding(combined_content, model=model)
        
        # Store the combined content
        course_texts.append(combined_content)
        course_embeddings.append(embedding_vector)
        course_metadatas.append({
            "course_id": course_id,  # Primary identifier
            "course_name": course_name if course_name else course_id,  # Fallback to course_id if name not found
            "source": "document",
            "has_course_profile": bool(course_profile),
            "num_reviews": len(all_reviews),
            "num_syllabi": len(all_syllabi)
        })
        # Use course_id as the document ID (one embedding per course ID)
        course_ids.append(course_id)
    
    # Save all courses to "courses" collection (one document per course)
    if course_texts:
        print("\n" + "=" * 60)
        print(f"Adding {len(course_texts)} course document(s) to ChromaDB...")
        add_documents_to_vectordb(
            texts=course_texts,
            embeddings=course_embeddings,
            metadatas=course_metadatas,
            ids=course_ids,
            collection_name="courses",
            persist_directory=persist_directory,
            clear_existing=True,  # Clear collection to avoid duplicates
            embedding_model=model,
            use_server=True,  # 서버 모드 사용
            server_host="localhost",
            server_port=8000
        )
        print("✅ Successfully saved courses to 'courses' collection!")
    else:
        print("\nNo course documents to save")
    
    print("\n" + "=" * 60)
    print("✅ Processing complete!")
    print(f"   Courses collection: {len(course_texts)} documents")


if __name__ == "__main__":
    # Example usage
    try:
        process_document_folder()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

