import { FC } from "react";

export const ErrorLabel: FC<{ error: string }> = ({ error }) => {
  return <span className="text-red-500">{error}</span>;
};
