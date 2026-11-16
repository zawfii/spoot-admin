import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // /api/* też tylko dla admin/editor — /api/ai/* wydaje klucz Anthropic (było otwarte dla każdego).
  const isApi = request.nextUrl.pathname.startsWith('/api');
  const deny = (status: 401 | 403) => isApi
    ? NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Forbidden' }, { status })
    : NextResponse.redirect(new URL(status === 401 ? '/login' : '/login?error=unauthorized', request.url));

  if (!user) return deny(401);

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile?.role || !['admin', 'editor'].includes(profile.role)) return deny(403);

  return supabaseResponse;
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
