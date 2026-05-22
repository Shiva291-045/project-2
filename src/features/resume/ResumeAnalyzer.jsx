import React, { useState } from "react";
import { Header } from "../../components/layout/Header";
import { Sidebar } from "../../components/layout/Sidebar";
import { Card, Button, Container, Badge, Alert, Spinner } from "../../components/ui";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Zap,
  FileText,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import toast from "react-hot-toast";

export const ResumeAnalyzer = () => {
  const [resume, setResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = [...e.dataTransfer.files];
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const base64Data = e.target.result;
        setResume({
          name: file.name,
          size: file.size,
          type: file.type,
        });

        // Upload resume and get analysis
        const res = await apiClient.post("/api/resume/upload", {
          base64Data,
          fileName: file.name,
        });

        if (res.data.success) {
          // Use actual analysis from backend
          setAnalysis({
            atsScore: res.data.data?.atsScore || res.data.atsScore || 75,
            strengths: res.data.data?.strengths || res.data.strengths || [],
            improvements: res.data.data?.improvements || res.data.improvements || [],
            skills: res.data.data?.skills || res.data.skills || [],
            missingKeywords: res.data.data?.missingKeywords || res.data.missingKeywords || [],
            suggestions: res.data.data?.suggestions || res.data.suggestions || [],
          });
          toast.success("Resume analyzed successfully!");
        } else {
          toast.error("Failed to analyze resume");
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      toast.error("Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const getATSColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-20 md:ml-64">
        <Header />
        <main className="flex-1 overflow-auto">
          <Container className="py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Resume Analyzer
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Get ATS scoring and AI-powered improvement suggestions for your resume
              </p>
            </div>

            {/* Upload Section */}
            {!analysis ? (
              <Card
                className={`border-2 border-dashed transition-all ${
                  dragActive
                    ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="p-12 text-center">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="flex justify-center">
                        <Spinner size="lg" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Analyzing your resume...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/20 mb-4">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Upload Your Resume
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Drag and drop your PDF resume here, or click to browse
                      </p>

                      <input
                        type="file"
                        id="resume-upload"
                        accept=".pdf"
                        onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                        className="hidden"
                      />

                      <label htmlFor="resume-upload">
                        <Button as="span" className="cursor-pointer">
                          Choose File
                        </Button>
                      </label>

                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                        PDF files only, max 5MB
                      </p>
                    </>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* ATS Score Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-cyan-50 dark:from-purple-900/20 dark:to-cyan-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        ATS Score
                      </p>
                      <p className={`text-5xl font-bold ${getATSColor(analysis.atsScore)}`}>
                        {analysis.atsScore}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Out of 100
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white">
                        <div className="text-center">
                          <p className="text-3xl font-bold">{analysis.atsScore}</p>
                          <p className="text-xs opacity-75">ATS Score</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* File Info */}
                <Card>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {resume?.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {(resume?.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setAnalysis(null);
                        setResume(null);
                      }}
                      className="ml-auto"
                    >
                      Change File
                    </Button>
                  </div>
                </Card>

                {/* Strengths */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Strengths</span>
                  </h2>
                  <div className="space-y-3">
                    {analysis.strengths.map((strength, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">{strength}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Areas to Improve */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span>Areas to Improve</span>
                  </h2>
                  <div className="space-y-3">
                    {analysis.improvements.map((improvement, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                      >
                        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-300">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Skills */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span>Extracted Skills</span>
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, index) => (
                      <Badge key={index} variant="primary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>

                {/* Missing Keywords */}
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <span>Missing Keywords</span>
                  </h2>
                  <Alert variant="warning">
                    <p className="text-sm mb-3">
                      Consider adding these keywords to improve your ATS score:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingKeywords.map((keyword, index) => (
                        <Badge key={index} variant="warning">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </Alert>
                </Card>

                {/* AI Suggestions */}
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <Card>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      <span>Improvement Suggestions</span>
                    </h2>
                    <div className="space-y-3">
                      {analysis.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        >
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="gradient"
                    className="flex-1 flex items-center justify-center space-x-2"
                  >
                    <span>Download Suggestions</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setAnalysis(null);
                      setResume(null);
                    }}
                    variant="secondary"
                    className="flex-1"
                  >
                    Analyze Another Resume
                  </Button>
                </div>
              </div>
            )}
          </Container>
        </main>
      </div>
    </div>
  );
};
