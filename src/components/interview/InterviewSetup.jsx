import { useState, useEffect, useRef } from "react";
import { FaVideo, FaVolumeUp, FaCheck, FaExclamationTriangle, FaPlay } from "react-icons/fa";
import "./InterviewSetup.css";

export default function InterviewSetup({ onSetupComplete }) {
    const [step, setStep] = useState(1);
    const [devices, setDevices] = useState({ cameras: [], speakers: [] });
    const [selectedCamera, setSelectedCamera] = useState("");
    const [selectedSpeaker, setSelectedSpeaker] = useState("");
    const [audioLevel, setAudioLevel] = useState(0);
    const [stream, setStream] = useState(null);
    const [isTestingAudio, setIsTestingAudio] = useState(false);

    const videoRef = useRef(null);
    const audioRef = useRef(null); // Ref for the test sound
    const animationFrameRef = useRef(null);

    // Initial Device Fetch
    useEffect(() => {
        const getDevices = async () => {
            const list = await navigator.mediaDevices.enumerateDevices();
            setDevices({
                cameras: list.filter(d => d.kind === 'videoinput'),
                speakers: list.filter(d => d.kind === 'audiooutput')
            });
        };
        getDevices();
    }, []);

    // Step 4 Video Attachment
    useEffect(() => {
        if (step === 4 && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [step, stream]);

    const requestCameraPermission = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            const list = await navigator.mediaDevices.enumerateDevices();
            const cameras = list.filter(d => d.kind === 'videoinput');
            setDevices(prev => ({ ...prev, cameras }));
            if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
            setStep(2);
        } catch (err) {
            alert("Camera access is required.");
        }
    };

    const requestSpeakerPermission = async () => {
        // Speaker selection doesn't require a 'stream', just enumeration
        const list = await navigator.mediaDevices.enumerateDevices();
        const speakers = list.filter(d => d.kind === 'audiooutput');
        setDevices(prev => ({ ...prev, speakers }));
        if (speakers.length > 0) setSelectedSpeaker(speakers[0].deviceId);
        setStep(3);
    };

    const startDeviceTest = () => {
        setStep(4);
    };

    const playSpeakerTest = async () => {
        if (!audioRef.current) return;

        try {
            setIsTestingAudio(true);
            // Route audio to selected speaker
            if (audioRef.current.setSinkId) {
                await audioRef.current.setSinkId(selectedSpeaker);
            }

            audioRef.current.currentTime = 0;
            audioRef.current.play();
            simulateVolumeMeter();
        } catch (err) {
            console.error("Speaker test failed", err);
        }
    };

    // Since we can't "record" the speaker, we simulate the meter 
    // to show the user that audio is actually being sent to the device.
    const simulateVolumeMeter = () => {
        let val = 0;
        const interval = setInterval(() => {
            val = Math.random() * 30 + 70; // Simulate high output level
            setAudioLevel(val);
        }, 100);

        setTimeout(() => {
            clearInterval(interval);
            setAudioLevel(0);
            setIsTestingAudio(false);
        }, 3000); // Test lasts 3 seconds
    };

    const completeSetup = () => {
        onSetupComplete({ stream, selectedCamera, selectedSpeaker });
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="setup-step">
                        <div className="setup-icon"><FaVideo size={64} /></div>
                        <h2>Camera Access</h2>
                        <button className="btn btn-primary btn-lg" onClick={requestCameraPermission}>Allow Camera</button>
                    </div>
                );
            case 2:
                return (
                    <div className="setup-step">
                        <div className="setup-icon success"><FaCheck size={64} /></div>
                        <h2>Select Camera</h2>
                        <select className="device-dropdown" value={selectedCamera} onChange={e => setSelectedCamera(e.target.value)}>
                            {devices.cameras.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label}</option>)}
                        </select>
                        <button className="btn btn-primary btn-lg" onClick={requestSpeakerPermission}>Continue to Speakers</button>
                    </div>
                );
            case 3:
                return (
                    <div className="setup-step">
                        <div className="setup-icon"><FaVolumeUp size={64} /></div>
                        <h2>Select Speakers</h2>
                        <select className="device-dropdown" value={selectedSpeaker} onChange={e => setSelectedSpeaker(e.target.value)}>
                            {devices.speakers.map(s => <option key={s.deviceId} value={s.deviceId}>{s.label || 'Default Speaker'}</option>)}
                        </select>
                        <button className="btn btn-primary btn-lg" onClick={startDeviceTest}>Test Devices</button>
                    </div>
                );
            case 4:
                return (
                    <div className="setup-step">
                        <h2>Final Test</h2>
                        <div className="device-test-container">
                            <div className="video-preview">
                                <video ref={videoRef} autoPlay muted playsInline />
                            </div>
                            <div className="audio-test">
                                <label>Speaker Output Test:</label>
                                <button className="btn btn-primary" onClick={playSpeakerTest} disabled={isTestingAudio}>
                                    <FaPlay /> {isTestingAudio ? "Playing..." : "Play Test Sound"}
                                </button>
                                <div className="audio-level-bar" style={{ marginTop: '15px' }}>
                                    <div className={`audio-level-fill ${audioLevel >= 70 ? 'good' : 'low'}`} style={{ width: `${audioLevel}%` }} />
                                </div>
                                <span className="audio-level-text">{Math.round(audioLevel)}%</span>

                                <audio ref={audioRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
                            </div>
                        </div>
                        <div className="setup-actions">
                            <button className="btn btn-success btn-lg" onClick={completeSetup}>Start Interview</button>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        // inside return (...)
        <div className="interview-setup-overlay fade-in">
            <div className="setup-glass-card">
                {/* Progress Header */}
                <div className="setup-stepper mb-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`step-indicator ${step >= i ? 'completed' : ''} ${step === i ? 'active' : ''}`}>
                            <div className="step-circle">{step > i ? <FaCheck /> : i}</div>
                            {i < 4 && <div className="step-line" />}
                        </div>
                    ))}
                </div>

                <div className="setup-content-window">
                    {renderStep()}
                </div>
            </div>
        </div>
    );
}