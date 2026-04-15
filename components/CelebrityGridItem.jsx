"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CelebrityGridItem({
  name,
  onToggle,
  state = "normal",
  isDisabled,
}) {
  // Use a smaller font if the name is long (more than 13 chars or 3+ words)
  console.log(`Rendering ${name} with state ${state} and isDisabled=${isDisabled}`);
  //const isLongName = name.length > 13 || name.split(" ").length > 2;
  const isLongName = "";
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImgUrl(null);
    setError(false);
    setLoading(true);
    async function fetchImage() {
      try {
        const response = await fetch(
          `/api/image?name=${encodeURIComponent(name)}`,
        );
        console.log(`Fetching image for ${name}:`, response);
        if (!response.ok) {
          setError(true);
          return;
        }
        const data = await response.json();
        if (data.imageUrl) {
          setImgUrl(data.imageUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(`Error fetching image for ${name}:`, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchImage();
  }, [name]);

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md transition-all duration-200 flex flex-col items-center justify-between p-0 w-full aspect-square ${
        state === "normal" ? "hover:shadow-lg hover:scale-105" : ""
      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""} bg-gradient-to-br from-gray-200 to-gray-300`}
    >
      {/* Image Container - 90% of space */}
      <div
        className={`w-full flex-[9] relative bg-gray-100 rounded-t flex items-center justify-center overflow-hidden flex-shrink-0 transition-all duration-200 ${
          state === "cross" ? "brightness-50" : ""
        }`}
      >
        {loading && <div className="text-xs text-gray-500">Loading...</div>}
        {error || !imgUrl ? (
          <div className="text-xs text-gray-500 text-center px-1" aria-label={`No image available for ${name}`}>[No image]</div>
        ) : (
          <Image
            src={imgUrl}
            alt={`Photo of ${name}`}
            fill
            className="object-cover"
            unoptimized
            onError={() => {
              setError(true);
              setImgUrl(null);
            }}
          />
        )}
        {/* Checkmark or Cross overlay */}
        {state === "check" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-3xl sm:text-2xl font-bold text-green-500 drop-shadow-lg">
              ✔
            </div>
          </div>
        )}
        {state === "cross" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-2xl sm:text-xl font-bold text-red-500 drop-shadow-lg">
              ✕
            </div>
          </div>
        )}
      </div>

      {/* Name Container - more height and larger font for clarity */}
      <div
        className={`w-full h-6 flex items-center justify-center flex-shrink-0 overflow-hidden transition-colors ${
          state === "cross"
            ? "bg-red-100"
            : state === "check"
              ? "bg-green-100"
              : "bg-gray-100"
        }`}
      >
        <span
          className={`text-center ${isLongName ? "text-[0.65rem]" : "text-xs"} font-bold px-1 leading-tight
            md:whitespace-nowrap md:truncate
            whitespace-normal break-words line-clamp-2
            ${state === "cross" ? "text-red-800" : state === "check" ? "text-green-800" : "text-gray-800"}
          `}
          title={name}
        >
          {name}
        </span>
      </div>
    </button>
  );
}
