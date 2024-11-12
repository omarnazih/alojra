"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface InstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDontShowAgain: (checked: boolean) => void;
  isAutoOpened?: boolean;
}

export function Instructions({ 
  open, 
  onOpenChange, 
  onDontShowAgain, 
  isAutoOpened 
}: InstructionsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl mb-4 text-right">كيفية استخدام التطبيق</DialogTitle>
          <DialogDescription className="space-y-4 text-right">
            <p>١. اختر نوع المركبة (باص، ميكروباص، تاكسي، أو مخصص)</p>
            <p>٢. أدخل سعر التذكرة للراكب الواحد</p>
            <p>٣. عند دفع أي راكب، اضغط على بطاقته وأدخل المبلغ المدفوع</p>
            <p>٤. إذا دفع الراكب أكثر من السعر، سترى كم يجب أن تعيد له</p>
            <p>٥. عند إعادة الباقي للراكب، علّم على المربع لتأكيد ذلك</p>
            <p>٦. يمكنك رؤية إجمالي المبلغ المحصل والمتبقي في الأعلى</p>
            <p>٧. استخدم زر التصفير ↺ لبدء رحلة جديدة</p>
            {isAutoOpened && (
              <div className="flex items-center gap-2 mt-6 border-t pt-4">
                <Checkbox 
                  id="dont-show-again"
                  onCheckedChange={(checked) => onDontShowAgain(checked as boolean)}
                />
                <Label htmlFor="dont-show-again">لا تظهر مرة أخرى</Label>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
} 