const hasIndexedDb = (env) => Boolean(env?.indexedDB);
const hasOpfs = (env) => Boolean(env?.navigator?.storage?.getDirectory);
const hasSpeechSynthesis = (env) => Boolean(env?.speechSynthesis);
const hasSpeechRecognition = (env) =>
  Boolean(env?.SpeechRecognition || env?.webkitSpeechRecognition);
const hasMicrophone = (env) =>
  Boolean(env?.navigator?.mediaDevices?.getUserMedia);
const hasWebGpu = (env) => Boolean(env?.navigator?.gpu);

export const detectCapabilities = (env) => {
  const indexedDb = hasIndexedDb(env);
  const opfs = hasOpfs(env);
  const localTTS = hasSpeechSynthesis(env);
  const localSTT = hasSpeechRecognition(env);
  const microphone = hasMicrophone(env);
  const webgpu = hasWebGpu(env);

  let tier = "minimal";
  if (indexedDb && localTTS && (localSTT || microphone)) {
    tier = "standard-local";
  }
  if (tier === "standard-local" && webgpu && opfs) {
    tier = "accelerated-local";
  }

  return {
    tier,
    webgpu,
    opfs,
    indexedDb,
    localTTS,
    localSTT,
    microphone,
  };
};
