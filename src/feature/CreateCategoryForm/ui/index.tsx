import { Input } from "@/components/ui/input";
import {
  ColorPicker,
  HEX_COLOR_REGEX,
  PRESET_COLORS,
} from "@/src/share/ui/ColorPicker";
import { FC, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import {
  ICategory,
  ICreateCategoryReq,
} from "@/src/share/api/model/categories";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { IQueryError } from "@/src/share/api/model/api";
import { toast } from "@/components/ui/toast";

export const CreateCategoryForm: FC = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState<string>("");
  const [color, setColor] = useState<string>("#000000");

  const api = new CategoriesApiService();
  const { mutate, error, isPending, isSuccess } = useMutation<
    ICategory,
    AxiosError<IQueryError>,
    ICreateCategoryReq
  >({
    mutationKey: ["create category"],
    mutationFn: (req: ICreateCategoryReq) => api.create(req),
  });

  const submit = () => {
    mutate({ name, color });
  };
  useEffect(() => {
    if (error) {
      toast.add({
        type: "error",
        title: "Category creation error",
        description: error.response?.data?.error ?? "Failed to create category",
      });
    }
    if (isSuccess) {
      toast.add({
        title: "Category created!",
        type: "success",
      });
      setName("");
      setColor("#000000");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    }
  }, [isPending, isSuccess, error]);
  return (
    <form
      className="flex gap-2 max-w-96"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="w-full">
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <ColorPicker
        value={color}
        onValueChange={setColor}
        swatches={PRESET_COLORS}
        label="Category color"
      />
      <Button
        onClick={submit}
        disabled={name.trim() === "" || !HEX_COLOR_REGEX.test(color) || isPending}
        className="cursor-pointer"
      >
        Add category
      </Button>
    </form>
  );
};
