import { NextRequest, NextResponse } from 'next/server';
import {
  runFastValidation,
  runFullCanonicalAudit,
} from '@/lib/game/assets/github-release-validator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/asset-version/validate
 * Runs Fast or Full validation on a target release tag.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tag, mode } = body || {};

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số tag cần kiểm định.' },
        { status: 400 }
      );
    }

    const validationMode = mode === 'full' ? 'full' : 'fast';
    const result =
      validationMode === 'full'
        ? await runFullCanonicalAudit(tag.trim())
        : await runFastValidation(tag.trim());

    return NextResponse.json({
      success: true,
      validation: result,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: `Lỗi kiểm định release: ${err instanceof Error ? err.message : 'Unknown'}`,
      },
      { status: 500 }
    );
  }
}
