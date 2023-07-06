export interface User {
  id?: string;
  updated_at?: string;
  created_at?: string;
  created_by_app_id?: string;
  created_by_user?: string;
  last_updated_by_app_id?: string;
  last_updated_by_user?: string;
  email?: string;
  organization_id?: string;
  display_name?: string;
  snapchat_username?: string;
  member_status?: string;
}

export interface Profile {
  me: User;
  members: User[];
  request_status: string;
  request_id: string;
}
