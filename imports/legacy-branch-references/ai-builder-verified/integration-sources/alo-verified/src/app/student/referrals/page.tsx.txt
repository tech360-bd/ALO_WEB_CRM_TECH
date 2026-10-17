'use client'

import { useEffect, useState } from 'react'
import {
  Users, Copy, Check, Share2, Gift, UserPlus, Trophy, Sparkles, ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface DashboardData {
  student?: { id: string; studentId: string; name: string }
}

interface ReferredFriend {
  id: string
  name: string
  email: string
  status: string
  joinedAt: string
}

const REWARDS = [
  { count: '1', reward: '£25 Amazon voucher', unlocked: false },
  { count: '3', reward: '£100 cashback on application fee', unlocked: false },
  { count: '5', reward: 'Free IELTS mock test bundle', unlocked: false },
  { count: '10', reward: '£500 tuition discount', unlocked: false },
]

export default function ReferralsPage() {
  const session = getSession()
  const { data } = usePortalData<DashboardData>({
    endpoint: '/api/dashboard',
    params: { userId: session?.user.id, userType: 'student' },
  })

  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const referralCode = data?.student?.studentId || session?.user.referenceId || 'ALO-STUDENT'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // setState here is the standard client-only mount/update pattern: we
      // need window.location.origin which isn't available during SSR. The
      // rule react-hooks/set-state-in-effect warns about cascading renders,
      // but this is unavoidable for client-only derived state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShareUrl(`${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`)
    }
  }, [referralCode])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Referral link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      try {
        const input = document.createElement('textarea')
        input.value = shareUrl
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.focus()
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        setCopied(true)
        toast.success('Referral link copied to clipboard')
        setTimeout(() => setCopied(false), 2000)
      } catch {
        toast.error('Copy failed — please copy the link manually')
      }
    }
  }

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Study abroad with ALO Education',
          text: `Hi! I'm using ALO Education to study abroad. Use my referral link to get started:`,
          url: shareUrl,
        })
        toast.success('Thanks for sharing!')
      } catch {
        // user cancelled — silent
      }
    } else {
      handleCopy()
    }
  }

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Hi! I'm using ALO Education to study abroad. Use my referral link to get £50 off your application fee: ${shareUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  // Referred friends — currently an empty state until a referral API ships.
  // (We use the student's referralCode above so when someone signs up with ?ref=CODE,
  // they will appear here in a future iteration.)
  const referredFriends: ReferredFriend[] = []

  return (
    <div className="min-h-screen flex flex-col space-y-6">
      <PageHeader
        title="Refer & Earn"
        description="Share ALO Education with friends — both of you earn rewards when they enrol."
      />

      {/* Referral hero card */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#0057B8] to-[#0073E6] p-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Badge className="bg-white/20 text-white border-0 mb-2">Your Referral Code</Badge>
              <h2 className="text-3xl font-bold tracking-tight break-all">{referralCode}</h2>
              <p className="text-sm text-blue-100 mt-1">
                Share this link — your friend gets £50 off their application fee.
              </p>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur shrink-0">
              <Gift className="h-8 w-8" />
            </div>
          </div>
        </div>
        <CardContent className="p-5">
          <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Your referral link</label>
          <div className="flex flex-wrap gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="bg-slate-50 font-mono text-xs sm:text-sm h-11 flex-1 min-w-[200px]"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              onClick={handleCopy}
              className="h-11 px-4 bg-[#0057B8] hover:bg-[#00449a] text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" /> Copy
                </>
              )}
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-11 px-4 border-slate-200"
            >
              <Share2 className="h-4 w-4 mr-1.5" /> Share
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              onClick={handleWhatsAppShare}
              variant="outline"
              size="sm"
              className="h-8 text-xs border-green-200 text-green-700 hover:bg-green-50"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Share on WhatsApp
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            When someone signs up using your link, they will appear in your referral list below.
          </p>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6 flex-1">
        {/* Stats */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-[#0057B8]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{referredFriends.length}</p>
                  <p className="text-xs text-slate-500">Friends referred</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-[#FFF7ED] flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-[#E8501A]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">£0</p>
                  <p className="text-xs text-slate-500">Rewards earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-green-50 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {referredFriends.filter((f) => f.status === 'enrolled').length}
                  </p>
                  <p className="text-xs text-slate-500">Friends enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referred list */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0057B8]" /> Your Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referredFriends.length === 0 ? (
              <div className="text-center py-10">
                <div className="h-14 w-14 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-3">
                  <Users className="h-7 w-7 text-[#0057B8]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No referrals yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                  Share your referral link with friends who want to study abroad. When they sign up and enrol, you both
                  earn rewards.
                </p>
                <Button onClick={handleShare} className="bg-[#E8501A] hover:bg-[#c8420f] text-white">
                  <Share2 className="h-4 w-4 mr-2" /> Share your link
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {referredFriends.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="h-9 w-9 rounded-full bg-[#EFF6FF] text-[#0057B8] text-xs font-bold flex items-center justify-center">
                      {f.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500 truncate">{f.email}</p>
                    </div>
                    <Badge
                      className={
                        f.status === 'enrolled'
                          ? 'bg-green-50 text-green-700 border-0'
                          : 'bg-amber-50 text-amber-700 border-0'
                      }
                    >
                      {f.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rewards milestones */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-[#E8501A]" /> Rewards Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {REWARDS.map((r) => (
              <div
                key={r.count}
                className={`p-4 rounded-xl border-2 ${
                  r.unlocked ? 'border-[#0057B8] bg-[#EFF6FF]/40' : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-bold text-slate-900">{r.count}</span>
                  {r.unlocked ? (
                    <Badge className="bg-green-100 text-green-700 border-0">Unlocked</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-500">Locked</Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-700">{r.reward}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Rewards unlock automatically when your referred friends enrol in their course.
          </p>
        </CardContent>
      </Card>

      <footer className="mt-auto pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} ALO Education — Empowering students worldwide.
      </footer>
    </div>
  )
}
