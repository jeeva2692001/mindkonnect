import React from "react";
import { Link } from "react-router-dom";

const Logout = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: "#F1F0FB", fontFamily: "Inter, sans-serif" }}
    >
      <div
        className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg text-center max-w-md w-full"
        style={{ boxShadow: "0 10px 20px rgba(0,0,0,0.15)" }}
      >
        <h1
          className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
          style={{ color: "#7182B8" }}
        >
          You have been logged out
        </h1>
        <p className="text-gray-600 mb-6 text-sm sm:text-base">
          For your security, we automatically log you out of{" "}
          <strong>MindKonnect</strong> after 15 minutes of inactivity.
        </p>
        <Link
          to="/auth"
          className="inline-block py-2 sm:py-2 px-4 sm:px-5 border border-transparent rounded-3xl shadow-sm text-sm sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:bg-[#8A76E0]"
          style={{
            backgroundColor: "#9B87F5",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          Login to Continue
        </Link>
      </div>
    </div>
  );
};

export default Logout;