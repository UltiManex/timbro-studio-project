
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit3, Trash2, Download, Play, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import type { Project } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { downloadFile } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onProjectClick: (project: Project) => void;
}

export function ProjectCard({ project, onDelete, onProjectClick }: ProjectCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const getStatusBadgeVariant = (status: Project['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'Completed':
        return 'default'; // Using 'default' for a positive/neutral completed state, often green or blue in themes
      case 'Ready for Review':
        return 'secondary'; // A distinct color like yellow or a lighter shade of primary
      case 'Processing':
        return 'outline'; // Neutral, perhaps gray
      case 'Error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: Project['status']) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Ready for Review':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'Processing':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-500" />;
      case 'Error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  }

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent navigation if a button or dropdown was clicked.
    if ((e.target as HTMLElement).closest('button, [role="menuitem"]')) {
      return;
    }
    onProjectClick(project);
  };
  
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Prevent card click handler from firing
    onProjectClick(project);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click handler from firing
    if (!project.finalAudioUrl) {
      toast({ title: 'Download failed', description: 'No download URL available.', variant: 'destructive'});
      return;
    }

    setIsDownloading(true);
    toast({ title: 'Starting Download...', description: `${project.name}.mp3` });

    try {
      await downloadFile(project.finalAudioUrl, `${project.name}.mp3`);
    } catch (error: any) {
      toast({ title: 'Download Error', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold leading-tight hover:text-primary transition-colors">
            <Link href={`/projects/${project.id}/edit`} onClick={handleLinkClick}>{project.name}</Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-radix-dropdown-menu-trigger>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/edit`} onClick={handleLinkClick} className="flex items-center">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(project.id)} className="text-destructive focus:bg-destructive/10 focus:text-destructive flex items-center">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
              {project.status === 'Completed' && project.finalAudioUrl && (
                 <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownload} disabled={isDownloading} className="flex items-center">
                    {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </DropdownMenuItem>
                 </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(project.date), { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow py-2">
        <div className="flex items-center gap-2 mb-2">
          {getStatusIcon(project.status)}
          <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
        </div>
        {project.audioFileName && (
          <p className="text-sm text-muted-foreground truncate" title={project.audioFileName}>
            File: {project.audioFileName}
          </p>
        )}
        {project.duration && (
          <p className="text-sm text-muted-foreground">
            Duration: {Math.floor(project.duration / 60)}m {Math.round(project.duration % 60)}s
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        {project.status === 'Ready for Review' || project.status === 'Error' ? (
          <Button asChild className="w-full" size="sm" onClick={(e) => { e.stopPropagation(); onProjectClick(project); }}>
            <Link href={`/projects/${project.id}/edit`}>
              {project.status === 'Error' ? 'View Error & Retry' : 'Review Suggestions'}
            </Link>
          </Button>
        ) : project.status === 'Completed' ? (
           <Button variant="outline" className="w-full" size="sm" disabled={!project.finalAudioUrl || isDownloading} onClick={handleDownload}>
            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {isDownloading ? 'Downloading...' : 'Download MP3'}
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full" size="sm">
            Processing...
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
