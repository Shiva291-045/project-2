import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";
import apiClient from "../../services/apiClient";
import "./InterviewRoom.css";

// Speech Recognition Setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export const InterviewRoom = () => {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [sessionData, setSessionData] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  // Refs
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const recordingTimeRef = useRef(0);
  const recordingTimerRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        recordingTimeRef.current = 0;
        recordingTimerRef.current = setInterval(() => {
          recordingTimeRef.current += 1;
        }, 1000);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        clearInterval(recordingTimerRef.current);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      return () => {
        recognitionRef.current?.abort();
      };
    }
  }, []);

  // Fetch interview session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await apiClient.get(`/api/interview/${interviewId}`);
        if (response.data.success) {
          setSessionData(response.data.interview);
          setTranscript(response.data.interview.transcript || []);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    };

    if (interviewId && user) {
      fetchSession();
    }
  }, [interviewId, user]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Start speech recognition
  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        setUserInput("");
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting recording:", error);
      }
    } else {
      alert("Speech Recognition not supported in your browser");
    }
  };

  // Handle speech recognition result
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.onresult = (event) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setUserInput(final.trim());
          setInterimTranscript("");
        }
      };
      recognitionRef.current.stop();
    }
  };

  // Send response to AI
  const sendResponse = async () => {
    if (!userInput.trim() || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage = userInput.trim();
      setUserInput("");

      // Add user message to transcript
      const updatedTranscript = [
        ...transcript,
        {
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
        },
      ];
      setTranscript(updatedTranscript);

      // Send to backend
      const response = await apiClient.post(
        `/api/interview/${interviewId}/respond`,
        { userResponse: userMessage }
      );

      if (response.data.success) {
        // Add AI response to transcript
        setTranscript([
          ...updatedTranscript,
          {
            role: "assistant",
            content: response.data.aiResponse,
            timestamp: new Date().toISOString(),
            feedback: response.data.feedback,
          },
        ]);

        setFeedback(response.data.feedback);
      }
    } catch (error) {
      console.error("Error sending response:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // End interview
  const endInterview = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post(
        `/api/interview/${interviewId}/end`
      );

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setSessionEnded(true);
      }
    } catch (error) {
      console.error("Error ending interview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionData) {
    return (
      <div className="interview-loading">
        <div className="spinner"></div>
        <p>Loading interview session...</p>
      </div>
    );
  }

  if (sessionEnded && analysis) {
    return <InterviewAnalysis analysis={analysis} />;
  }

  return (
    <div className="interview-room">
      <div className="interview-header">
        <h1>Interview Room</h1>
        <div className="interview-info">
          <span className="interview-type">{sessionData.interviewType}</span>
          <span className="interview-status">Active</span>
        </div>
      </div>

      <div className="interview-container">
        <div className="messages-section">
          <div className="messages">
            <AnimatePresence>
              {transcript.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`message ${message.role}`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    {message.feedback && (
                      <div className="message-feedback">
                        <span className="feedback-score">
                          Score: {message.feedback.score}/10
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="input-section">
          {feedback && (
            <div className="feedback-card">
              <h4>Feedback</h4>
              <p>{feedback.message}</p>
              {feedback.score && (
                <p className="score">Score: {feedback.score}/10</p>
              )}
            </div>
          )}

          <div className="input-area">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendResponse();
                }
              }}
              placeholder="Type your response or use voice input..."
              disabled={isLoading}
              className="response-input"
              rows="4"
            />
            {interimTranscript && (
              <div className="interim-text">Listening: {interimTranscript}...</div>
            )}

            <div className="input-controls">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`btn-voice ${isRecording ? "recording" : ""}`}
                title="Use microphone"
              >
                {isRecording ? (
                  <>
                    <span className="recording-dot"></span>
                    Stop Recording
                  </>
                ) : (
                  <>
                    <span className="mic-icon">🎤</span>
                    Start Recording
                  </>
                )}
              </button>

              <button
                onClick={sendResponse}
                disabled={isLoading || !userInput.trim()}
                className="btn-send"
              >
                {isLoading ? "Sending..." : "Send Response"}
              </button>

              <button
                onClick={endInterview}
                disabled={isLoading}
                className="btn-end"
              >
                End Interview
              </button>
            </div>

            {isRecording && (
              <div className="recording-indicator">
                <span className="pulse"></span>
                Recording... {recordingTimeRef.current}s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Interview Analysis Component
function InterviewAnalysis({ analysis }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="interview-analysis"
    >
      <div className="analysis-header">
        <h2>Interview Analysis</h2>
        <div className="overall-score">
          <div className="score-circle">
            <span className="score-value">
              {analysis?.overallScore || 75}
            </span>
            <span className="score-label">/100</span>
          </div>
        </div>
      </div>

      <div className="analysis-content">
        {analysis?.summary && (
          <div className="analysis-section">
            <h3>Summary</h3>
            <p>{analysis.summary}</p>
          </div>
        )}

        {analysis?.strengths && (
          <div className="analysis-section">
            <h3>Strengths</h3>
            <ul>
              {analysis.strengths.map((strength, i) => (
                <li key={i}>✓ {strength}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis?.weaknesses && (
          <div className="analysis-section">
            <h3>Areas for Improvement</h3>
            <ul>
              {analysis.weaknesses.map((weakness, i) => (
                <li key={i}>• {weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis?.improvements && (
          <div className="analysis-section">
            <h3>Recommendations</h3>
            <ul>
              {analysis.improvements.map((improvement, i) => (
                <li key={i}>→ {improvement}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis?.technicalAccuracy !== undefined && (
          <div className="analysis-grid">
            <AnalysisMetric
              label="Technical Accuracy"
              value={analysis.technicalAccuracy}
            />
            <AnalysisMetric label="Clarity" value={analysis.clarity} />
            <AnalysisMetric label="Completeness" value={analysis.completeness} />
            <AnalysisMetric label="Communication" value={analysis.communication} />
          </div>
        )}
      </div>

      <div className="analysis-actions">
        <button onClick={() => navigate("/dashboard")} className="btn-primary">
          Back to Dashboard
        </button>
        <button onClick={() => navigate("/interview")} className="btn-secondary">
          New Interview
        </button>
      </div>
    </motion.div>
  );
}

function AnalysisMetric({ label, value }) {
  return (
    <div className="metric">
      <h4>{label}</h4>
      <div className="metric-bar">
        <div className="metric-fill" style={{ width: `${value}%` }}></div>
      </div>
      <span className="metric-value">{value}%</span>
    </div>
  );
}
