import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET: Fetch document list for an organization by slug (public endpoint for mobile app)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Create service role client to bypass RLS for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { slug } = await params;

    // First, get the organization by slug
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', slug)
      .single();

    if (orgError || !organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch document metadata for the organization (only public info)
    const { data: documents, error } = await supabase
      .from('agent_document_tool')
      .select('id, file_name, file_size, mime_type, created_at')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    // Add signing URLs to documents
    const documentsWithUrls = (documents || []).map(doc => ({
      ...doc,
      signing_url: `/es/sign-document/${doc.id}`
    }));

    return NextResponse.json({ 
      documents: documentsWithUrls,
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      }
    });

  } catch (error) {
    console.error('Public documents GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
