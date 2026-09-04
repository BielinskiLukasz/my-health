export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage?.persist) {
    const granted = await navigator.storage.persist()
    console.log("Persistent storage:", granted ? "granted" : "denied")
    return granted
  }
  return false
}
