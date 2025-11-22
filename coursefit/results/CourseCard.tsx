import React from "react";
import { Star } from "lucide-react";
import resultsSectionStyles from "../styles/resultsSection.styles";
import ReasonCard from "./ReasonCard";
import { CourseRecommendation } from "../types";

interface CourseCardProps {
  course: CourseRecommendation;
  animationDelay: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, animationDelay }) => (
  <div
    className={resultsSectionStyles.card}
    style={{ animationDelay: `${animationDelay}ms` }}
  >
    <div className={resultsSectionStyles.cardInner}>
      <div className={resultsSectionStyles.courseInfo}>
        <div className="flex items-center gap-3 mb-3">
          <span className={resultsSectionStyles.courseTag}>Course</span>
          <h3 className={resultsSectionStyles.courseName}>
            {course.courseName}
          </h3>
        </div>
        <div className={resultsSectionStyles.courseMetaContainer}>
          <span className={resultsSectionStyles.courseMetaItem}>
            학점: {course.credits}
          </span>
          <span className={resultsSectionStyles.courseMetaItem}>
            코드: {course.courseCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className={resultsSectionStyles.similarityLabel}>유사도</span>
          <div>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(course.similarity * 5)
                    ? resultsSectionStyles.starFilled
                    : resultsSectionStyles.starEmpty
                }
              />
            ))}
            <span className={resultsSectionStyles.similarityText}>
              {Math.round(course.similarity * 100)}%
            </span>
          </div>
        </div>
      </div>

      <ReasonCard reason={course.reason} />
    </div>
  </div>
);

export default CourseCard;
