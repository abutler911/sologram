import React, { useState, useEffect } from "react";

const AIContentGenerator = () => {
  const [formData, setFormData] = useState({
    description: "",
    contentType: "general",
    tone: "casual",
    additionalContext: "",
  });

  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentHistory, setContentHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const contentTypes = [
    { value: "general", label: "General Post" },
    { value: "product", label: "Product Showcase" },
    { value: "behind-scenes", label: "Behind the Scenes" },
    { value: "educational", label: "Educational" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "announcement", label: "Announcement" },
  ];

  const tones = [
    { value: "casual", label: "Casual & Friendly" },
    { value: "professional", label: "Professional" },
    { value: "playful", label: "Fun & Playful" },
    { value: "inspirational", label: "Inspirational" },
    { value: "minimalist", label: "Clean & Minimal" },
  ];

  useEffect(() => {
    if (showHistory) {
      fetchContentHistory();
    }
  }, [showHistory]);

  const fetchContentHistory = async () => {
    try {
      const response = await fetch("/api/admin/ai-content/history", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await response.json();
      setContentHistory(data.data || []);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      setContentHistory([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setError("Please provide a description for your content");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/admin/ai-content/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate content");
      }

      setGeneratedContent(data.data);
    } catch (error) {
      setError(
        error.message || "Failed to generate content. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!generatedContent) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/ai-content/save", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...generatedContent,
          originalDescription: formData.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save content");
      }

      alert("Content saved to history!");
      if (showHistory) {
        fetchContentHistory(); // Refresh history
      }
    } catch (error) {
      setError("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUseContent = (content) => {
    const contentText = `Title: ${content.title}\n\nCaption: ${
      content.caption
    }\n\nTags: ${content.tags.map((tag) => `#${tag}`).join(" ")}`;

    navigator.clipboard
      .writeText(contentText)
      .then(() => {
        alert(
          "Content copied to clipboard! You can now paste it into your post creation form."
        );
      })
      .catch(() => {
        alert("Content ready to use! Check the preview below.");
      });
  };

  const resetForm = () => {
    setFormData({
      description: "",
      contentType: "general",
      tone: "casual",
      additionalContext: "",
    });
    setGeneratedContent(null);
    setError("");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Content Generator
        </h1>
        <p className="text-gray-600">
          Generate engaging social media content with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what your post is about... (e.g., 'New product launch - innovative wireless headphones with noise cancellation')"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="4"
                maxLength="500"
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {contentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tone
                </label>
                <select
                  name="tone"
                  value={formData.tone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tones.map((tone) => (
                    <option key={tone.value} value={tone.value}>
                      {tone.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Context (Optional)
              </label>
              <textarea
                name="additionalContext"
                value={formData.additionalContext}
                onChange={handleInputChange}
                placeholder="Any additional details, target audience, or specific requirements..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="2"
                maxLength="200"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !formData.description.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "✨ Generate Content"
                )}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {showHistory ? "Hide" : "Show"} Content History
            </button>
          </div>
        </div>

        {/* Generated Content Preview */}
        <div className="space-y-6">
          {generatedContent && (
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Content
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveContent}
                    disabled={isSaving}
                    className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors duration-200"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => handleUseContent(generatedContent)}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
                  >
                    Use Content
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Title</h4>
                  <p className="bg-white p-3 rounded border text-gray-900">
                    {generatedContent.title}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Caption</h4>
                  <p className="bg-white p-3 rounded border text-gray-900 whitespace-pre-wrap">
                    {generatedContent.caption}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.tags &&
                      generatedContent.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                  </div>
                </div>

                {generatedContent.altText && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Alt Text</h4>
                    <p className="bg-white p-3 rounded border text-gray-600">
                      {generatedContent.altText}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content History */}
          {showHistory && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Content
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {contentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No content history yet
                  </p>
                ) : (
                  contentHistory.map((item) => (
                    <div key={item._id} className="bg-white p-4 rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-sm text-gray-900">
                          {item.generatedContent?.title || "Untitled"}
                        </h5>
                        <span className="text-xs text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {item.originalDescription}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {item.contentType}
                        </span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          {item.tone}
                        </span>
                        {item.used && (
                          <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                            Used
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUseContent(item.generatedContent)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                      >
                        Use this content
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIContentGenerator;
