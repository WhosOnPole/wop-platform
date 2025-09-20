import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVImportProps {
  onImport: (data: any[]) => Promise<void>;
  sampleData: Record<string, any>;
  entityName: string;
}

export const CSVImport = ({ onImport, sampleData, entityName }: CSVImportProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const generateSampleCSV = () => {
    const headers = Object.keys(sampleData).join(',');
    const values = Object.values(sampleData).map(v => `"${v}"`).join(',');
    const csvContent = `${headers}\n${values}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityName}-sample.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        setPreview(data);
      } catch (error) {
        toast({
          title: "Parse error",
          description: "Failed to parse CSV file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    
    setIsUploading(true);
    try {
      await onImport(preview);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Success",
        description: `Imported ${preview.length} ${entityName}(s) successfully`
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: "Failed to import data",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          CSV Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateSampleCSV}>
            <Download className="w-4 h-4 mr-2" />
            Download Sample
          </Button>
        </div>
        
        <div>
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <Input
            ref={fileInputRef}
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="mt-1"
          />
        </div>

        {preview.length > 0 && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Preview: {preview.length} rows ready to import
              </AlertDescription>
            </Alert>
            
            <div className="max-h-40 overflow-auto border rounded p-2">
              <div className="text-xs font-mono">
                {preview.slice(0, 5).map((row, index) => (
                  <div key={index} className="mb-1">
                    {JSON.stringify(row)}
                  </div>
                ))}
                {preview.length > 5 && <div>... and {preview.length - 5} more rows</div>}
              </div>
            </div>
            
            <Button 
              onClick={handleImport} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? 'Importing...' : `Import ${preview.length} Records`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};