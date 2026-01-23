import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { startInterview, sendAnswer, endInterview } from "../services/api";
import TypingIndicator from "../components/TypingIndicator";
import InterviewSetup from "../components/interview/InterviewSetup";
import SpeechToTextInput from "../components/interview/SpeechToTextInput";
import { useAudioMonitor } from "../hooks/useAudioMonitor";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import { FaExclamationTriangle, FaVideo, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import "./CandidateInterview.css";

export default function CandidateInterview() {
  const { state } = useLocation();
  // console.log(state)
  // console.log(state)
  // console.log(state);
  const navigate = useNavigate();

  const [setupComplete, setSetupComplete] = useState(false);
  const [setupData, setSetupData] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questionNumber, setQuestionNumber] = useState(0);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [timeLeft, setTimeLeft] = useState(state?.duration * 60 );
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const videoRef = useRef(null);

  const { speak, stop, speaking } = useTextToSpeech();

  const { noiseLevel } = useAudioMonitor(
    setupData?.analyser,
    (violation) => {
      setViolations(prev => [...prev, violation]);
      setShowViolationAlert(true);
      setTimeout(() => setShowViolationAlert(false), 3000);
    }
  );

  useEffect(() => {
    if (setupComplete && setupData?.stream && videoRef.current) {
      videoRef.current.srcObject = setupData.stream;
    }
  }, [setupComplete, setupData]);

  useEffect(() => {
    if (currentQuestion && autoSpeak) {
      speak(currentQuestion);
    }
  }, [currentQuestion, autoSpeak]);


  useEffect(() => {
    if (loading) return;

    if (timeLeft <= 0) {
      alert("⏱️ Time is up! Please answer faster.");
      setViolations((v) => [...v, { type: "TIME_EXCEEDED" }]);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading]);

  // Track tab switches using visibility change
  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log("Tab is now hidden (User switched tabs)");
      setViolations((prev) => [
        ...prev,
        { type: "TAB_SWITCH", time: new Date().toISOString() }
      ]);
    } else {
      console.log("Tab is now visible (User came back)");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);


  // Track tab switches
  useEffect(() => {
    const handleBlur = () => {
      setViolations((prev) => [
        ...prev,
        { type: "TAB_SWITCH", time: new Date().toISOString() }
      ]);
      console.log("Tab switch detected");
      // alert("⚠️ Please do not switch tabs during the interview.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const handleSetupComplete = (data) => {
    setSetupData(data);
    setSetupComplete(true);
  };

  useEffect(() => {
    if (!setupComplete) return;

    async function init() {
      setLoading(true);
      try {
        const res = await startInterview(state);
        console.log(res)
        setSessionId(res.session_id);
        setCurrentQuestion(res.question);
        setQuestionNumber(1);
        setConversationHistory([{ type: 'question', text: res.question, number: 1 }]);
      } catch (error) {
        console.error("Error starting interview:", error);
        
        if (error.message.includes("authenticated") || error.message.includes("expired")) {
          alert("Your session has expired. Please login again.");
          navigate("/login");
        } else {
          alert(`Failed to start interview: ${error.message}`);
        }
        
        // Clean up resources
        if (setupData?.stream) {
          setupData.stream.getTracks().forEach(track => track.stop());
        }
        if (setupData?.audioContext) {
          setupData.audioContext.close();
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setupComplete, state, navigate, setupData]);


  const handleSend = async (answer) => {
    if (!answer.trim() || loading) return;

    stop(); // Stop any ongoing speech
    setLoading(true);

    // Add answer to history
    setConversationHistory(prev => [
      ...prev,
      { type: 'answer', text: answer, number: questionNumber }
    ]);

    try {
      const res = await sendAnswer({
        session_id: sessionId,
        scheduledInterviewId: state?.scheduledInterviewId,
        answer: answer,
        timeRemaining : timeLeft
      });

      if (res.question) {
        setQuestionNumber(prev => prev + 1);
        setCurrentQuestion(res.question);
        setConversationHistory(prev => [
          ...prev,
          { type: 'question', text: res.question, number: questionNumber + 1 }
        ]);
      } else {
        // Interview completed
        alert("Interview completed! Proceeding to feedback.");
        finishInterview();
      }
    } catch (error) {
      console.error("Error sending answer:", error);
      
      if (error.message.includes("authenticated") || error.message.includes("expired")) {
        alert("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        alert(`Failed to send answer: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const finishInterview = async () => {
    if (!window.confirm("Are you sure you want to end the interview?")) {
      return;
    }

    stop(); // Stop any ongoing speech
    setLoading(true);
    
    try {
      const res = await endInterview({
        session_id: sessionId,
        violations,
        credentialId: state?.credentialId,
        scheduledInterviewId: state?.scheduledInterviewId
      });
      
      if (setupData?.stream) {
        setupData.stream.getTracks().forEach(track => track.stop());
      }
      if (setupData?.audioContext) {
        setupData.audioContext.close();
      }
      
      navigate("/dashboard");
    } catch (error) {
      console.error("Error ending interview:", error);
      
      if (error.message.includes("authenticated") || error.message.includes("expired")) {
        alert("Your session has expired. Please login again.");
        navigate("/login");
      } else {
        alert(`Failed to end interview: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const toggleAutoSpeak = () => {
    if (autoSpeak) {
      stop();
    }
    setAutoSpeak(!autoSpeak);
  };

  if (!setupComplete) {
    return <InterviewSetup onSetupComplete={handleSetupComplete} />;
  }


  return (
    <div className="interview-container">
      {showViolationAlert && (
        <div className="violation-alert">
          <FaExclamationTriangle />
          <span>Violation detected! Please maintain a quiet environment.</span>
        </div>
      )}

      <div className="interview-layout">
        <div className="interview-sidebar">
          <div className="video-monitor">
            <video ref={videoRef} autoPlay muted playsInline />
            <div className="video-label">
              <FaVideo /> Camera Feed
            </div>
          </div>

          <div className="interview-stats">
            <div className="stat-item">
              <label>Time Remaining</label>
              <div className={`stat-value ${timeLeft < 30 ? 'warning' : ''}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>

            <div className="stat-item">
              <label>Violations</label>
              <div className={`stat-value ${violations.length > 0 ? 'danger' : ''}`}>
                {violations.length}
              </div>
            </div>

            <div className="stat-item">
              <label>Noise Level</label>
              <div className="noise-meter">
                <div 
                  className={`noise-fill ${noiseLevel > 60 ? 'high' : ''}`}
                  style={{ width: `${noiseLevel}%` }}
                />
              </div>
              <span className="noise-text">{Math.round(noiseLevel)}%</span>
            </div>
          </div>

          {violations.length > 0 && (
            <div className="violations-list">
              <h4><FaExclamationTriangle /> Violations</h4>
              <div className="violations-scroll">
                {violations.map((v, i) => (
                  <div key={i} className="violation-item">
                    <span className="violation-type">{v.type.replace('_', ' ')}</span>
                    <span className="violation-time">
                      {new Date(v.time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="interview-main">
          <div className="interview-header">
            <div>
              <h2>AI Interview Session</h2>
              <p className="interview-info">
                {state?.role || 'Position'} - {state?.type || 'Interview Type'}
              </p>
            </div>
            <div className="header-actions">
              <button
                className={`btn ${autoSpeak ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleAutoSpeak}
                title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
              >
                {autoSpeak ? <FaVolumeUp /> : <FaVolumeMute />}
                {autoSpeak ? 'Audio On' : 'Audio Off'}
              </button>
              <button
                className="btn btn-danger"
                onClick={finishInterview}
                disabled={loading}
              >
                End Interview
              </button>
            </div>
          </div>

          <div className="question-container">
            <div className="question-display">
              <div className="question-header">
                <h3>Question {questionNumber}</h3>
                {speaking && <span className="speaking-indicator">🔊 Speaking...</span>}
              </div>
              <div className="question-text">
                {loading ? (
                  <TypingIndicator />
                ) : (
                  <p>{currentQuestion}</p>
                )}
              </div>
            </div>

            {/* {conversationHistory.length > 1 && (
              <div className="conversation-summary">
                <h4>Previous Questions</h4>
                <div className="history-scroll">
                  {conversationHistory.slice(0, -1).map((item, i) => (
                    item.type === 'question' && (
                      <div key={i} className="history-item">
                        <span className="history-number">Q{item.number}</span>
                        <span className="history-text">{item.text.substring(0, 60)}...</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )} */}
          </div>

          <div className="answer-section">
            <SpeechToTextInput
              onSubmit={handleSend}
              disabled={loading}
              analyser={setupData?.analyser}
              interviewerSpeaking={speaking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
