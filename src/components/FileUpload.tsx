"use client";
import { uploadToS3 } from "@/lib/db/s3";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Inbox, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

type Props = {};

const FileUpload = () => {
  const [uploading, setUploading] = useState(false);

  const { mutate, isSuccess } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFile) => {
      console.log(acceptedFile, "this is accepted file");
      const file = acceptedFile[0];
      if (file.size > 10 * 1024 * 1024) {
        toast.error("file size is more than 10 mb");
        return;
      }
      try {
        setUploading(true);
        const data = await uploadToS3(file);
        console.log(data, "the uploaded data");
        if (!data?.file_key || !data.file_name) {
          toast.error("something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: (data) => {
            console.log(data);
            // toast.success(data.message);
          },
          onError: (err) => {
            toast.error("Error while creating chat");
          },
        });
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });
  return (
    <div className="p-2 bg-white rounded-xl">
      <div
        {...getRootProps()}
        className="border-dashed border-2 rounded-xl cursor-pointer bg-gray-50 py-8 flex flex-col items-center justify-center"
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm mt-2 text-slate-400">
              Spilling Tea to GPT...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Inbox className="w-10 h-10 text-blue-500" />
            <p className="mt-2 text-sm text-slate-400 ">Drop PDF Here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
