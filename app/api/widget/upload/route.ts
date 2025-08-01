import { NextRequest, NextResponse } from 'next/server';
import { optionalWidgetAuth, getOrganizationId } from '@/lib/auth/widget-supabase-auth';
import { supabase } from '@/lib/supabase';

// Widget file upload API - handles file attachments for messages

export const POST = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const organizationId = getOrganizationId(request, auth);

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organization ID', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    const messageId = formData.get('messageId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB', code: 'FILE_TOO_LARGE' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed', code: 'INVALID_FILE_TYPE' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `widget-uploads/${organizationId}/${fileName}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('widget-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('[Widget Upload API] Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file', code: 'UPLOAD_ERROR' },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseClient.storage
      .from('widget-attachments')
      .getPublicUrl(filePath);

    // Create file attachment record in database
    const attachmentData = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      message_id: messageId,
      organization_id: organizationId,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_url: publicUrl,
      file_path: filePath,
      metadata: {
        source: 'widget',
        uploaded_at: new Date().toISOString(),
        original_name: file.name
      }
    };

    const { data: attachment, error: dbError } = await supabaseClient
      .from('widget_file_attachments')
      .insert(attachmentData)
      .select()
      .single();

    if (dbError) {
      console.error('[Widget Upload API] Database error:', dbError);
      // Try to clean up the uploaded file
      await supabaseClient.storage
        .from('widget-attachments')
        .remove([filePath]);
      
      return NextResponse.json(
        { error: 'Failed to save file record', code: 'DATABASE_ERROR' },
        { status: 500 }
      );
    }

    console.log('[Widget Upload API] File uploaded successfully:', attachment.id);

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: publicUrl,
        uploadedAt: attachment.created_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Widget Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
});

export const GET = optionalWidgetAuth(async (request: NextRequest, context: any, auth) => {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');
    const organizationId = getOrganizationId(request, auth);

    if (!attachmentId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Initialize Supabase service role client
    const supabaseClient = supabase.admin();

    // Get attachment with organization context
    const { data: attachment, error } = await supabaseClient
      .from('widget_file_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(attachment);

  } catch (error) {
    console.error('[Widget Upload API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}); 