import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCreateJob, useListCategories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, ChevronLeft, Zap, Clock, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URGENCIES = [
  { value: "standard", label: "Standard", desc: "Non-urgent, flexible timing", icon: Briefcase, color: "border-gray-200 hover:border-gray-400" },
  { value: "urgent", label: "Urgent", desc: "Needed within 24 hours", icon: Clock, color: "border-orange-200 hover:border-orange-400" },
  { value: "emergency", label: "Emergency", desc: "Critical, needs immediate attention", icon: Zap, color: "border-red-200 hover:border-red-400" },
];

export default function PostJobPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useListCategories();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [urgency, setUrgency] = useState("standard");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");

  const createMutation = useCreateJob({
    mutation: {
      onSuccess: (job) => {
        toast({ title: "Job posted!", description: "Your job is now live. Tradies will be notified." });
        setLocation(`/jobs/${job.id}`);
      },
      onError: (err) => {
        const msg = (err as { data?: { message?: string } })?.data?.message ?? "Failed to post job";
        setError(msg);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) { setError("Please select a category"); return; }
    createMutation.mutate({
      data: {
        title,
        description,
        categoryId: Number(categoryId),
        urgency: urgency as "standard" | "urgent" | "emergency",
        suburb: suburb || undefined,
        postcode: postcode || undefined,
        address: address || undefined,
        budget: budget ? Number(budget) : undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="bg-[hsl(222,47%,11%)] text-white px-6 py-6">
        <div className="container max-w-2xl">
          <button onClick={() => setLocation("/dashboard")} className="flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Post a Job</h1>
          <p className="text-white/70 mt-1">Tell us what needs fixing and we'll match you with the right tradie.</p>
        </div>
      </div>

      <div className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <Card>
              <CardHeader><CardTitle>Job Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input id="title" placeholder="e.g. Leaking kitchen tap needs fixing" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" placeholder="Describe the problem in detail. What needs to be done? Any special requirements?" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trade category" />
                    </SelectTrigger>
                    <SelectContent>
                      {(categories ?? []).map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Urgency Level</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {URGENCIES.map((u) => (
                    <label
                      key={u.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        urgency === u.value
                          ? "border-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/5"
                          : `${u.color} bg-background`
                      }`}
                    >
                      <input type="radio" name="urgency" value={u.value} checked={urgency === u.value} onChange={(e) => setUrgency(e.target.value)} className="sr-only" />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        urgency === u.value ? "bg-[hsl(38,92%,50%)]" : "bg-muted"
                      }`}>
                        <u.icon className={`h-5 w-5 ${urgency === u.value ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{u.label}</p>
                        <p className="text-sm text-muted-foreground">{u.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Location</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address">Street Address (optional)</Label>
                  <Input id="address" placeholder="123 Main St" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="suburb">Suburb</Label>
                    <Input id="suburb" placeholder="Bondi" value={suburb} onChange={(e) => setSuburb(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input id="postcode" placeholder="2026" value={postcode} onChange={(e) => setPostcode(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Budget (optional)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <Label htmlFor="budget">Estimated Budget (AUD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                    <Input id="budget" type="number" className="pl-7" placeholder="0" value={budget} onChange={(e) => setBudget(e.target.value)} min="0" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tradies will use this as a guide for their quotes.</p>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full bg-[hsl(38,92%,50%)] hover:bg-[hsl(38,92%,44%)] text-white font-semibold h-12 text-base"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Posting job…" : "Post Job & Get Matched"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
