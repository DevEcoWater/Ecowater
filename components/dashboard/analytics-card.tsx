"use client";

const AnalyticsCard = ({
  children,
  title,
  subTitle,
}: {
  children: React.ReactNode;
  title?: string;
  subTitle?: string;
}) => {
  return (
    <div className="dark:bg-tertiary border rounded-md p-6 h-full">
      <div className="mb-3 flex flex-col justify-start">
        <p>{title}</p>
        <span className="text-muted-foreground text-sm">{subTitle}</span>
      </div>
      {children}
    </div>
  );
};

export default AnalyticsCard;
