import {
  mentorRecommendations,
  subjectPerformance,
  type Assessment,
  type Student,
} from "@/lib/evaluation";
import { Briefcase, BookOpen, CheckCircle2, FileText, Sparkles, Video } from "lucide-react";

interface AiMentorReportProps {
  student: Student;
  assessments: Assessment[];
}

export default function AiMentorReport({ student, assessments }: AiMentorReportProps) {
  const subjects = subjectPerformance(assessments);
  const recommendations = mentorRecommendations(subjects);
  const strongBySubject = new Map(recommendations.strong.map((item) => [item.subject, item]));
  const developingBySubject = new Map(
    recommendations.developing.map((item) => [item.subject, item]),
  );
  const weakBySubject = new Map(recommendations.weak.map((item) => [item.subject, item]));

  return (
    <section className="my-6 border-t pt-6">
      <div className="mb-5 flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <div>
          <h2 className="font-serif text-xl font-semibold">AI Mentor Report</h2>
          <p className="text-sm text-muted-foreground">
            Subject-by-subject guidance for {student.first_name} {student.last_name}
          </p>
        </div>
      </div>

      {!subjects.length ? (
        <p className="rounded-lg border p-5 text-sm text-muted-foreground">
          Add marks to see recommendations for each subject.
        </p>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => {
            const subjectName = `${subject.course_code} · ${subject.title}`;
            const strong = strongBySubject.get(subjectName);
            const developing = developingBySubject.get(subjectName);
            const weak = weakBySubject.get(subjectName);
            const status = weak ? "Needs support" : strong ? "Strong" : "Building strength";
            const statusClass = weak
              ? "bg-risk-high-soft text-risk-high"
              : strong
                ? "bg-risk-low-soft text-risk-low"
                : "bg-risk-moderate-soft text-risk-moderate";

            return (
              <article key={subject.course_code} className="rounded-lg border bg-card p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{subject.course_code}</p>
                    <h3 className="font-semibold">{subject.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{subject.percent}%</span>
                    <span className={`rounded px-2 py-1 text-xs font-medium ${statusClass}`}>
                      {status}
                    </span>
                  </div>
                </div>

                {weak ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="h-4 w-4 text-risk-high" /> 3-week study plan
                      </h4>
                      <ol className="space-y-2">
                        {weak.plan.map((step) => (
                          <li
                            key={step}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-risk-high" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="grid gap-3 border-t pt-3 sm:grid-cols-3">
                      <p className="text-sm">
                        <BookOpen className="mr-1 inline h-4 w-4" />
                        <strong>Book:</strong> {weak.book}
                      </p>
                      <p className="text-sm">
                        <FileText className="mr-1 inline h-4 w-4" />
                        <strong>Documents:</strong> {weak.document}
                      </p>
                      <p className="text-sm">
                        <Video className="mr-1 inline h-4 w-4" />
                        <strong>Video:</strong> {weak.video}
                      </p>
                    </div>
                  </div>
                ) : strong ? (
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <Briefcase className="h-4 w-4 text-risk-low" /> Career and business pathways
                    </h4>
                    <ul className="space-y-2">
                      {strong.ideas.map((idea) => (
                        <li key={idea} className="text-sm text-muted-foreground">
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{developing?.guidance}</p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
