import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const MediaContext = createContext();

export const useMedia = () => {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within MediaProvider');
  }
  return context;
};

export const MediaProvider = ({ children }) => {
  // States
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'unknown',
    microphone: 'unknown'
  });

  // Refs
  const mediaStreamRef = useRef(null);
  const initializationAttempts = useRef(0);
  const maxInitializationAttempts = 3;

  // Check permissions status
  const checkPermissions = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' });
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        
        setPermissionStatus({
          camera: cameraPermission.state,
          microphone: micPermission.state
        });

        // Listen for permission changes
        cameraPermission.onchange = () => {
          setPermissionStatus(prev => ({ ...prev, camera: cameraPermission.state }));
        };
        
        micPermission.onchange = () => {
          setPermissionStatus(prev => ({ ...prev, microphone: micPermission.state }));
        };
      }
    } catch (error) {
      console.log('Permissions API not supported:', error);
    }
  }, []);

  // Initialize permissions check on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Setup media with enhanced error handling and retry logic
  const setupMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    if (isInitializing) {
      console.log('Media initialization already in progress...');
      return;
    }

    setIsInitializing(true);
    setMediaError(null);
    
    try {
      // Stop existing stream first
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped existing ${track.kind} track`);
        });
        mediaStreamRef.current = null;
      }

      console.log('Requesting media permissions with constraints:', constraints);
      
      // Request media stream with timeout
      const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Media request timeout')), 10000)
      );

      const stream = await Promise.race([streamPromise, timeoutPromise]);
      
      if (!stream || !stream.active) {
        throw new Error('Failed to obtain active media stream');
      }

      mediaStreamRef.current = stream;

      // Check which tracks are available
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      setCameraEnabled(videoTracks.length > 0 && videoTracks[0].enabled);
      setMicEnabled(audioTracks.length > 0 && audioTracks[0].enabled);

      console.log(`Media setup successful:`, {
        video: videoTracks.length > 0,
        audio: audioTracks.length > 0,
        videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
        audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false
      });

      // Listen for track events
      stream.getTracks().forEach(track => {
        track.onended = () => {
          console.log(`${track.kind} track ended`);
          if (track.kind === 'video') {
            setCameraEnabled(false);
          } else if (track.kind === 'audio') {
            setMicEnabled(false);
          }
        };

        track.onmute = () => {
          console.log(`${track.kind} track muted`);
        };

        track.onunmute = () => {
          console.log(`${track.kind} track unmuted`);
        };
      });

      setMediaError(null);
      initializationAttempts.current = 0;
      
      return stream;

    } catch (error) {
      console.error('Media setup failed:', error);
      
      initializationAttempts.current += 1;
      let errorMessage = 'Failed to access camera and microphone';

      // Provide specific error messages based on error type
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera and microphone access denied. Please allow permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera or microphone constraints cannot be satisfied.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Media access blocked for security reasons. Ensure you\'re using HTTPS.';
      } else if (error.message === 'Media request timeout') {
        errorMessage = 'Media request timed out. Please check your devices and try again.';
      } else {
        errorMessage = `Media access failed: ${error.message}`;
      }

      // Try fallback options
      if (initializationAttempts.current < maxInitializationAttempts) {
        console.log(`Attempting fallback ${initializationAttempts.current}...`);
        
        if (initializationAttempts.current === 1 && constraints.video && constraints.audio) {
          // First fallback: try audio only
          console.log('Trying audio-only fallback...');
          setIsInitializing(false);
          return setupMedia({ video: false, audio: true });
        } else if (initializationAttempts.current === 2 && constraints.video) {
          // Second fallback: try lower video quality
          console.log('Trying lower quality video...');
          setIsInitializing(false);
          return setupMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 15 }
            },
            audio: true
          });
        }
      }

      setMediaError(errorMessage);
      setCameraEnabled(false);
      setMicEnabled(false);
      
      throw error;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Get current media stream
  const getMediaStream = useCallback(() => {
    return mediaStreamRef.current;
  }, []);

  // Check if media is ready
  const isMediaReady = useCallback(() => {
    return !!(
      mediaStreamRef.current && 
      mediaStreamRef.current.active &&
      (cameraEnabled || micEnabled)
    );
  }, [cameraEnabled, micEnabled]);

  // Stop media
  const stopMedia = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      mediaStreamRef.current = null;
    }
    setCameraEnabled(false);
    setMicEnabled(false);
    setMediaError(null);
  }, []);

  // Clear error
  const clearMediaError = useCallback(() => {
    setMediaError(null);
  }, []);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (!mediaStreamRef.current) return;

    const videoTracks = mediaStreamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const track = videoTracks[0];
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
    } else if (!cameraEnabled) {
      // If no video track exists, reinitialize with video
      try {
        await setupMedia({ video: true, audio: micEnabled });
      } catch (error) {
        console.error('Failed to enable camera:', error);
      }
    }
  }, [cameraEnabled, micEnabled, setupMedia]);

  // Toggle microphone
  const toggleMicrophone = useCallback(async () => {
    if (!mediaStreamRef.current) return;

    const audioTracks = mediaStreamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const track = audioTracks[0];
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    } else if (!micEnabled) {
      // If no audio track exists, reinitialize with audio
      try {
        await setupMedia({ video: cameraEnabled, audio: true });
      } catch (error) {
        console.error('Failed to enable microphone:', error);
      }
    }
  }, [cameraEnabled, micEnabled, setupMedia]);

  // Test microphone levels
  const testMicrophone = useCallback(async () => {
    if (!mediaStreamRef.current) {
      throw new Error('No media stream available');
    }

    const audioTracks = mediaStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No microphone available');
    }

    // Create audio context to test microphone input
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(mediaStreamRef.current);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      source.connect(analyser);

      return new Promise((resolve, reject) => {
        let maxVolume = 0;
        let sampleCount = 0;
        const maxSamples = 30; // Test for 3 seconds at ~10fps

        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          
          const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          maxVolume = Math.max(maxVolume, volume);
          sampleCount++;

          if (sampleCount >= maxSamples) {
            audioContext.close();
            if (maxVolume > 10) { // Threshold for detecting audio input
              resolve({ working: true, maxVolume, averageVolume: maxVolume });
            } else {
              reject(new Error('No audio input detected. Check your microphone.'));
            }
          } else {
            setTimeout(checkVolume, 100);
          }
        };

        checkVolume();
      });
    } catch (error) {
      throw new Error(`Microphone test failed: ${error.message}`);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  // Context value
  const contextValue = {
    // States
    cameraEnabled,
    micEnabled,
    mediaError,
    isInitializing,
    permissionStatus,
    
    // Functions
    setupMedia,
    getMediaStream,
    isMediaReady,
    stopMedia,
    clearMediaError,
    toggleCamera,
    toggleMicrophone,
    testMicrophone,
    checkPermissions
  };

  return (
    <MediaContext.Provider value={contextValue}>
      {children}
    </MediaContext.Provider>
  );
};

export default MediaContext;