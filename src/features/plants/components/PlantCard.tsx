import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import PlantBadge from "./PlantBadge";
import PlantStats from "./PlantStats";
import { useMedia } from "../../../lib/media/useMedia";
import type { Plant } from "../../../domain/types";

type AlertTone = "danger" | "warning" | "accent";

const alertInfoByPlant = (plant: Plant) => {
  if (plant.isSensitive && plant.lightLevel === "high") {
    return { tone: "danger" as AlertTone, label: "위험" };
  }

  if (plant.isSensitive) {
    return { tone: "warning" as AlertTone, label: "주의" };
  }

  return { tone: "accent" as AlertTone, label: "정상" };
};

const placeholderImage = "/sample_flower.jpg";

interface PlantCardProps {
  plant?: Plant;
  to?: string;
  footer?: ReactNode;
  direction?: "vertical" | "horizontal";
  isLoading?: boolean;
  className?: string;
  gridColumns?: number | null;
}

interface PlantCardSkeletonProps {
  direction?: "vertical" | "horizontal";
  className?: string;
  footer?: ReactNode;
  gridColumns?: number | null;
}

interface PlantCardContentProps {
  plant: Plant;
  to?: string;
  direction?: "vertical" | "horizontal";
  className?: string;
  footer?: ReactNode;
  gridColumns?: number | null;
}

function PlantCardSkeleton({
  direction = "vertical",
  className,
  footer,
  gridColumns,
}: PlantCardSkeletonProps) {
  const isHorizontal = direction === "horizontal";

  return (
    <article
      className={clsx("flex h-full shrink-0", className, {
        "w-full flex-row": isHorizontal,
        "flex-col": gridColumns,
        "w-[33vw] flex-col": !gridColumns && !isHorizontal,
      })}
    >
      <div className="relative overflow-hidden rounded-lg mb-4">
        <div
          className={clsx("bg-gray-200 animate-pulse", {
            "w-24 h-24 shrink-0": isHorizontal,
            "w-full aspect-4/5": !isHorizontal,
          })}
        />
        <div className="absolute right-0 top-[10%] flex flex-col gap-1">
          <div className="w-12 h-5 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="flex-1">
        <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>

      {footer && <div className="">{footer}</div>}
    </article>
  );
}

function PlantCardContent({
  plant,
  to,
  direction = "vertical",
  className,
  footer,
  gridColumns,
}: PlantCardContentProps) {
  const isHorizontal = direction === "horizontal";
  const alertInfo = alertInfoByPlant(plant);
  const media = useMedia();
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPhotoUrl = async () => {
      if (!plant.coverPhotoUri || !media) {
        setCoverPhotoUrl(null);
        return;
      }

      try {
        const url = await media.getThumbnailUrl(plant.coverPhotoUri);
        if (isMounted) {
          if (prevUrlRef.current?.startsWith("blob:")) {
            URL.revokeObjectURL(prevUrlRef.current);
          }
          prevUrlRef.current = url;
          setCoverPhotoUrl(url);
        }
      } catch (error) {
        console.warn("Failed to load plant photo:", error);
        if (isMounted) {
          setCoverPhotoUrl(null);
        }
      }
    };

    loadPhotoUrl();

    return () => {
      isMounted = false;
    };
  }, [plant.coverPhotoUri, media]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  const coverPhoto = coverPhotoUrl || placeholderImage;

  return (
    <article
      className={clsx("flex h-full shrink-0", className, {
        "w-full flex-row": isHorizontal,
        "flex-col": gridColumns,
        "w-[33vw] flex-col": !gridColumns && !isHorizontal,
      })}
    >
      <div className="relative overflow-hidden rounded-lg mb-4">
        <img
          src={coverPhoto}
          alt={`${plant.name} 대표 사진`}
          className={clsx("object-cover", {
            "w-24 h-24 shrink-0": isHorizontal,
            "w-full aspect-4/5": !isHorizontal,
          })}
        />
        <div className="absolute right-0 top-[10%] flex flex-col gap-1">
          <PlantBadge tone={alertInfo.tone} label={alertInfo.label} />
          {plant.isSensitive && <PlantBadge tone="muted" label="예민" />}
        </div>
      </div>

      {to ? (
        <Link to={to} className="flex-1 mb-3">
          <p className="text-lg font-bold text-[#3A3431] mb-2">{plant.name}</p>
          <PlantStats humidity={plant.humidity} temperature={plant.temperature} />
        </Link>
      ) : (
        <div className="flex-1">
          <p className="text-lg font-bold text-[#3A3431] mb-2">{plant.name}</p>
          <PlantStats humidity={plant.humidity} temperature={plant.temperature} />
        </div>
      )}

      {footer && <div className="">{footer}</div>}
    </article>
  );
}

export default function PlantCard({
  plant,
  to = plant ? `/plants/${plant.id}` : undefined,
  footer,
  direction = "vertical",
  isLoading = false,
  className,
  gridColumns,
}: PlantCardProps) {
  if (isLoading)
    return <PlantCardSkeleton direction={direction} className={className} footer={footer} />;
  if (!plant) return null;

  return (
    <PlantCardContent
      plant={plant}
      to={to}
      direction={direction}
      className={className}
      footer={footer}
      gridColumns={gridColumns}
    />
  );
}
