import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/AiMentorReport')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/AiMentorReport"!</div>
}
import React, { useEffect, useState } from 'react';

interface CareerSynergy {
  title: string;
  job_roles: string[];
  business_idea: string;
}

interface RemedialPlan {
  course_code: string;
  topic_title: string;
  current_score: number;
  study_plan: string[];
  resources: {
    books: string;
    documents: string;
    videos: string;
  };
}

interface MentorReportData {
  student_name: string;
  career_and_business_synergies: CareerSynergy[];
  remedial_study_plans: RemedialPlan[];
}

interface AiMentorReportProps {
  studentId: string;
}

export const AiMentorReport: React.FC<AiMentorReportProps> = ({ studentId }) => {
  const [report, setReport] = useState<MentorReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        // Adjust the URL to match your FastAPI backend endpoint route
        const response = await fetch(`http://localhost:8000/api/students/${studentId}/ai-report`);
        if (!response.ok) {
          throw new Error('Failed to fetch AI mentor report');
        }
        const data = await response.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchReport();
    }
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Generating Smart Mentor Insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <p className="font-semibold">Unable to load report</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">AI Smart Mentor</h2>
        <p className="text-sm text-gray-500">Personalized pathway & recovery roadmap for {report.student_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career & Business Synergies */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-indigo-700 font-semibold">
            <span>💼</span>
            <h3>Interdisciplinary Opportunities (≥70%)</h3>
          </div>
          
          {report.career_and_business_synergies.length === 0 ? (
            <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
              No subjects at or above 70% yet. Focus on the recovery plan below to build foundational strength.
            </p>
          ) : (
            report.career_and_business_synergies.map((synergy, idx) => (
              <div key={idx} className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl space-y-3">
                <h4 className="font-bold text-indigo-900 text-lg">{synergy.title}</h4>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Recommended Roles:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {synergy.job_roles.map((role, rIdx) => (
                      <span key={rIdx} className="bg-white text-indigo-800 text-xs px-2.5 py-1 rounded-md border border-indigo-200 font-medium shadow-2xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-indigo-100 text-sm text-gray-700">
                  <span className="font-semibold text-gray-900 block mb-0.5">💡 Startup / Project Idea:</span>
                  {synergy.business_idea}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Remedial Study Plans */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-rose-700 font-semibold">
            <span>📖</span>
            <h3>3-Week Recovery Plan (&lt;60%)</h3>
          </div>

          {report.remedial_study_plans.length === 0 ? (
            <p className="text-sm text-gray-500 bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
              🎉 Fantastic work! No subjects require remedial support at this time.
            </p>
          ) : (
            report.remedial_study_plans.map((plan, idx) => (
              <div key={idx} className="bg-rose-50/30 border border-rose-100 p-5 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900">{plan.course_code} · {plan.topic_title}</h4>
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2 py-0.5 rounded">
                    {plan.current_score}%
                  </span>
                </div>

                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  {plan.study_plan.map((step, sIdx) => (
                    <li key={sIdx}>{step}</li>
                  ))}
                </ol>

                <div className="pt-2 border-t border-rose-100 text-xs text-gray-600 space-y-1">
                  <div>📚 <span className="font-medium">Book:</span> {plan.resources.books}</div>
                  <div>📄 <span className="font-medium">Docs:</span> {plan.resources.documents}</div>
                  <div>▶️ <span className="font-medium">Video:</span> {plan.resources.videos}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};