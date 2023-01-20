declare enum NostrEventKind {
  Metadata = 0,
  Text = 1,
  RelayRec = 2,
  Contacts = 3,
  DM = 4,
  Deleted = 5,
  Repost = 6,
}

declare interface NostrBaseEvent {
  created_at: number
  id: string
  pubkey: string
  tags: string[][]
  sig: string
  content: string
}

declare interface NostrNoteEvent extends NostrBaseEvent {
  kind: 1
}

declare interface NostrProfileEvent extends NostrBaseEvent {
  kind: 0
}

declare interface NostrContactListEvent extends NostrBaseEvent {
  kind: 3
}

declare interface NostrRepostEvent extends NostrBaseEvent {
  kind: 6
}

declare interface NostrReactionEvent extends NostrBaseEvent {
  kind: 7
}

declare type NostrEvent = NostrNoteEvent | NostrProfileEvent | NostrContactListEvent | NostrRepostEvent

declare type NostrProfileContent = {
  picture?: string
  name?: string
  display_name?: string
  about?: string
  nip05?: string
  website?: string
  banner?: string
  lud06?: string
}

declare type NostrProfile = NostrProfileEvent & {
  content: NostrProfileContent
}

declare interface NostrFilter {
  ids?: string[]
  kinds?: NostrEventKind[]
  authors?: string[]
  since?: number
  until?: number
  "#e"?: string[]
  "#p"?: string[]
  limit?: number
}
