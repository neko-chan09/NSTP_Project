// src/pages/student/Dashboard.tsx
import React from "react";
import { Link } from "react-router-dom";
import { studentApi } from "../../services/api";
import { useQuery } from "@tanstack/react-query";
import RefreshButton from "../components/common/RefreshButton";

const StudentDashboard: React.FC = () => {
  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
    isFetching: profileFetching,
  } = useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => studentApi.getProfile(),
    staleTime: 60000,
  });

  const {
    data: documents = [],
    refetch: refetchDocs,
    isFetching: docsFetching,
  } = useQuery({
    queryKey: ["student", "documents"],
    queryFn: () => studentApi.getDocuments(),
    staleTime: 30000,
  });

  const {
    data: certificates = [],
    refetch: refetchCerts,
    isFetching: certsFetching,
  } = useQuery({
    queryKey: ["student", "certificates"],
    queryFn: () => studentApi.getCertificates(),
    staleTime: 60000,
  });

  const isRefreshing = profileFetching || docsFetching || certsFetching;

  const handleRefresh = () => {
    refetchProfile();
    refetchDocs();
    refetchCerts();
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="spinner" />
        <span className="ml-3 text-slate-500">Loading...</span>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-7 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-navy-900">
            Welcome, {user?.name || "Student"}!
          </h3>
          <p className="text-sm text-slate-500">
            {profile?.student_id} • {profile?.course}
            {profile?.section && <span> • Section: {profile.section}</span>}
          </p>
        </div>
        <RefreshButton onRefresh={handleRefresh} isLoading={isRefreshing} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            to: "/student/attendance",
            label: "Check-in",
            icon: "fa-calendar-check",
            color: "bg-navy-600",
          },
          {
            to: "/student/documents",
            label: "Upload Document",
            icon: "fa-upload",
            color: "bg-slate-600",
          },
          {
            to: "/student/certificates",
            label: "Certificates",
            icon: "fa-file-pdf",
            color: "bg-gold-600",
          },
        ].map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={`${action.color} text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
          >
            <i className={`fas ${action.icon} text-2xl`} />
            <span className="text-xs font-bold tracking-wide">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Component",
            value:
              profile?.nstp_component_selected?.toUpperCase() || "Not assigned",
            color: "border-gold-500",
          },
          {
            label: "Training Hours",
            value: `${profile?.completed_training_hours || 0} / 90`,
            color: "border-slate-500",
          },
          {
            label: "Status",
            value: profile?.is_eligible_for_completion
              ? "✅ Eligible"
              : "⏳ In Progress",
            color: "border-navy-600",
          },
          {
            label: "Section",
            value: profile?.section || "N/A",
            color: "border-purple-500",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${stat.color}`}
          >
            <span className="block text-xs text-slate-500">{stat.label}</span>
            <span className="text-lg font-bold text-navy-900">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Documents & Certificates */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">My Documents</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
              >
                <span className="text-sm text-navy-700 truncate flex-1">
                  {doc.file_name}
                </span>
                <span
                  className={`badge ${doc.status === "approved" ? "badge-success" : doc.status === "rejected" ? "badge-danger" : "badge-warning"}`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
            {documents.length === 0 && (
              <p className="text-sm text-slate-500">No documents uploaded</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h4 className="font-semibold text-navy-900 mb-4">My Certificates</h4>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex justify-between items-center p-2 bg-slate-50 rounded-lg"
              >
                <span className="text-sm text-navy-700">
                  {cert.certificate_number}
                </span>
                <span className="badge badge-info">
                  {cert.certificate_type}
                </span>
              </div>
            ))}
            {certificates.length === 0 && (
              <p className="text-sm text-slate-500">No certificates issued</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
