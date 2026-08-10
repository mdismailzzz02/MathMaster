export const SUPABASE_URL = "https://oipxdcgsmwzaljlezxhj.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pcHhkY2dzbXd6YWxqbGV6eGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMDkwNzksImV4cCI6MjEwMTY4NTA3OX0.BIo5aBgJhuTCfTd4ocCN85qVY_pgpzJud0qe0f9lIsU";

export const EDGE_FUNCTION_URL = (name: string) =>
  `${SUPABASE_URL}/functions/v1/${name}`;