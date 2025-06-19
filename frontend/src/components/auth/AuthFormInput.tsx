import React from "react";

interface AuthFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthFormInput = React.forwardRef<HTMLInputElement, AuthFormInputProps>(
  ({ label, error, type = "text", ...props }, ref) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}
        {...props}
      />
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  )
);
AuthFormInput.displayName = "AuthFormInput"; 