import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, X, Music, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { tracksApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UploadFile {
  file: File;
  title: string;
  artist: string;
  album: string;
}

export default function Upload() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isGuest = user && (user as any).isGuest;

  const uploadMutation = useMutation({
    mutationFn: async (uploadFile: UploadFile) => {
      const formData = new FormData();
      formData.append("audio", uploadFile.file);
      formData.append("title", uploadFile.title);
      formData.append("artist", uploadFile.artist);
      formData.append("album", uploadFile.album);

      const response = await tracksApi.upload(formData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast({
        title: "Success",
        description: "Track uploaded successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const audioFiles = files.filter(file => 
      file.type.includes("audio") || 
      file.name.toLowerCase().endsWith(".mp3") || 
      file.name.toLowerCase().endsWith(".wav")
    );

    const newUploadFiles = audioFiles.map(file => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const parts = nameWithoutExt.split(" - ");
      
      return {
        file,
        title: parts.length > 1 ? parts[1] : nameWithoutExt,
        artist: parts.length > 1 ? parts[0] : "",
        album: "",
      };
    });

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const updateUploadFile = (index: number, field: keyof Omit<UploadFile, 'file'>, value: string) => {
    setUploadFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    for (const uploadFile of uploadFiles) {
      if (!uploadFile.title.trim()) {
        toast({
          title: "Validation error",
          description: "Please provide a title for all tracks",
          variant: "destructive",
        });
        return;
      }
      
      try {
        await uploadMutation.mutateAsync(uploadFile);
      } catch (error) {
        // Error is handled in mutation onError
        break;
      }
    }
    
    if (!uploadMutation.isError) {
      setUploadFiles([]);
    }
  };

  if (isGuest) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-spotify-white">Upload Your Music</h1>
        
        {/* Guest Mode Notice */}
        <Card className="mb-8 bg-spotify-light-gray border-spotify-light-gray">
          <CardContent className="p-8 text-center">
            <Users className="mx-auto mb-4 w-16 h-16 text-spotify-text" />
            <h3 className="text-xl font-semibold mb-4 text-spotify-white">
              Upload Not Available in Guest Mode
            </h3>
            <p className="text-spotify-text mb-6 max-w-md mx-auto">
              To upload and manage your own music, you'll need to sign in with Google. 
              Guest mode lets you explore the app with existing tracks.
            </p>
            <Button
              onClick={() => window.location.href = "/api/auth/google"}
              className="bg-spotify-green hover:bg-spotify-green-hover text-black font-semibold"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Demo Information */}
        <Card className="bg-spotify-light-gray border-spotify-light-gray">
          <CardHeader>
            <CardTitle className="text-spotify-white">What you can do in Guest Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-spotify-text">
              <li>• Browse and play existing tracks</li>
              <li>• Explore the music library</li>
              <li>• Use the audio player controls</li>
              <li>• Experience the Spotify-inspired interface</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-spotify-white">Upload Your Music</h1>
      
      {/* Upload Area */}
      <Card className="mb-8 bg-spotify-light-gray border-spotify-light-gray">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-spotify-green border-opacity-60 bg-spotify-green bg-opacity-10"
                : "border-spotify-text border-opacity-30 hover:border-spotify-green hover:border-opacity-60"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload className={`mx-auto mb-4 w-12 h-12 transition-colors duration-200 ${
              isDragOver ? "text-spotify-green" : "text-spotify-text group-hover:text-spotify-green"
            }`} />
            <h3 className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
              isDragOver ? "text-spotify-green" : "text-spotify-white"
            }`}>
              Upload your tracks
            </h3>
            <p className="text-spotify-text mb-4">
              Drag and drop your .mp3 or .wav files here, or click to browse
            </p>
            <Button className="bg-spotify-green hover:bg-spotify-green-hover text-black font-semibold">
              Choose Files
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".mp3,.wav,audio/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-spotify-white">
              Ready to Upload ({uploadFiles.length})
            </h2>
            <Button
              onClick={handleUploadAll}
              disabled={uploadMutation.isPending}
              className="bg-spotify-green hover:bg-spotify-green-hover text-black font-semibold"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload All"}
            </Button>
          </div>

          {uploadFiles.map((uploadFile, index) => (
            <Card key={index} className="bg-spotify-light-gray border-spotify-light-gray">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Music className="w-8 h-8 text-spotify-green" />
                    <div>
                      <CardTitle className="text-spotify-white text-base">{uploadFile.file.name}</CardTitle>
                      <p className="text-sm text-spotify-text">
                        {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUploadFile(index)}
                    className="text-spotify-text hover:text-spotify-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`title-${index}`} className="text-spotify-text">
                      Track Title *
                    </Label>
                    <Input
                      id={`title-${index}`}
                      value={uploadFile.title}
                      onChange={(e) => updateUploadFile(index, "title", e.target.value)}
                      className="bg-spotify-gray border-spotify-gray text-spotify-white"
                      placeholder="Enter track title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`artist-${index}`} className="text-spotify-text">
                      Artist Name
                    </Label>
                    <Input
                      id={`artist-${index}`}
                      value={uploadFile.artist}
                      onChange={(e) => updateUploadFile(index, "artist", e.target.value)}
                      className="bg-spotify-gray border-spotify-gray text-spotify-white"
                      placeholder="Enter artist name"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`album-${index}`} className="text-spotify-text">
                      Album (Optional)
                    </Label>
                    <Input
                      id={`album-${index}`}
                      value={uploadFile.album}
                      onChange={(e) => updateUploadFile(index, "album", e.target.value)}
                      className="bg-spotify-gray border-spotify-gray text-spotify-white"
                      placeholder="Enter album name"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
