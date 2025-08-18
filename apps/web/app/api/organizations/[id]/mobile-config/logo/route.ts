import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/shared/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: organizationId } = await params;
  try {
    const supabase = getSupabaseServerClient();


    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('logo') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${organizationId}/mobile-logo-${Date.now()}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading logo:', uploadError);
      return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(fileName);

    // Update organization app config with new logo URL
    const { error: updateError } = await supabase
      .from('organization_app_configs')
      .upsert({
        organization_id: organizationId,
        theme_config: {
          logoUrl: publicUrl,
        },
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id'
      });

    if (updateError) {
      console.error('Error updating config with logo URL:', updateError);
      // Try to clean up uploaded file
      await supabase.storage
        .from('organization-assets')
        .remove([fileName]);
      return NextResponse.json({ error: 'Failed to save logo configuration' }, { status: 500 });
    }

    return NextResponse.json({ logoUrl: publicUrl });
  } catch (error) {
    console.error('Error in logo upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}