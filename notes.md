### Notes

- state {
  feed: [id, id, id],
  // feedByChannelId: {}
  feedByPubkey: {
  [pubkey]: [id, id, id],
  }
  noteById: { [id]: NoteData }
  profileByPubkey: { [pubkey]: Profile }
  }

when data is fetched on profile page, only add it to feedByPubkey and noteById
this will prevent home feed from being overloaded with profile notes
