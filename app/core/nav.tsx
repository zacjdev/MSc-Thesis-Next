"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Sport {
  _id: string;
  name: string;
}

const Container: React.FC = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/sports")
      .then((res) => res.json())
      .then(setSports)
      .catch((err) => console.error("Failed to fetch sports:", err));
  }, []);

  const formatSportSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-");

  // Determine currentSport safely
  let currentSport = "all";
  const pathSegment = pathname.split("/")[1];
  if (pathSegment && sports.some((s) => formatSportSlug(s.name) === pathSegment)) {
    currentSport = pathSegment;
  }

  return (
    <div className="w-full h-20 border-b-3 border-gray-200 dark:border-gray-700 flex items-center justify-center relative">
      {/* Left Section: Dropdown Button */}
      <div className="w-80 flex items-start justify-start relative">
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="text-3xl font-semibold flex items-start gap-1 hover:text-blue-500 ml-20 "
        >
          SportHub <span className="mt-1 text-2xl">↧</span>
        </button>

        {dropdownOpen && (
          <div className="ml-20 absolute top-16 bg-white dark:bg-dark-1 shadow-lg rounded-lg w-48 border border-gray-200 dark:border-gray-700 z-50">
            <Link
              href="/all/home"
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setDropdownOpen(false)}
            >
              All
            </Link>

            {sports.length > 0 ? (
              sports.map((sport) => (
                <Link
                  key={sport._id}
                  href={`/${formatSportSlug(sport.name)}/home`}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  {sport.name}
                </Link>
              ))
            ) : (
              <p className="px-4 py-2 text-gray-500">Loading...</p>
            )}
          </div>
        )}
      </div>

      {/* Middle Section */}
      <div className="w-full flex justify-center gap-10 text-2xl font-medium">
        <Link href={`/${currentSport}/home`} className="hover:text-blue-500">
          Home
        </Link>
        <Link href={`/${currentSport}/finder`} className="hover:text-blue-500">
          Event Finder
        </Link>
        <Link href={`/${currentSport}/clubs`} className="hover:text-blue-500">
          Clubs
        </Link>
      </div>

      {/* Right Section */}
      <div className="w-80 flex justify-end pr-4">
        <a className="text-3xl font-semibold mr-20" href="/admin/login">
          Login
        </a>
      </div>
    </div>
  );
};

export default Container;
