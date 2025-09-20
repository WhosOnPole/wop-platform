import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Camera, ArrowLeft } from "lucide-react";
import { useCreateFanPost, useUploadFanPostImage } from "@/hooks/useFanPosts";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

const SubmitFeature = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadImage = useUploadFanPostImage();
  const createPost = useCreateFanPost();

  // Redirect if not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const imageUrl = await uploadImage.mutateAsync(selectedFile);
      await createPost.mutateAsync({
        image_url: imageUrl,
        caption: caption.trim() || ""
      });
      
      // Reset form
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Share Your Racing Moment" />
      <main className="pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <p className="text-lg text-muted-foreground">
              Upload your best racing photos and moments to be featured on our homepage!
            </p>
          </div>

          <Card className="rounded-2xl shadow-racing">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-accent" />
                Submit Your Fan Feature
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="image">Photo *</Label>
                  <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="mx-auto max-h-64 rounded-xl object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(null);
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <div>
                          <Label htmlFor="file-upload" className="cursor-pointer">
                            <span className="text-accent font-medium">Click to upload</span>
                            <span className="text-muted-foreground"> or drag and drop</span>
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                        <Input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    placeholder="Tell us about this racing moment..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="min-h-[100px] rounded-2xl resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {caption.length}/500 characters
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-2xl">
                  <h3 className="font-medium text-foreground mb-2">Submission Guidelines</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Photos must be racing or motorsport related</li>
                    <li>• Keep content appropriate and family-friendly</li>
                    <li>• Only submit photos you own or have permission to share</li>
                    <li>• Posts are reviewed before appearing on the site</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full rounded-2xl"
                  disabled={!selectedFile || isSubmitting}
                  size="lg"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitFeature;