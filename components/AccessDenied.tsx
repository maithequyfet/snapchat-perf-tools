import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Access Denied</h1>
          <p className="py-6">You must be signed in to view this page</p>
          <button
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              signIn();
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
