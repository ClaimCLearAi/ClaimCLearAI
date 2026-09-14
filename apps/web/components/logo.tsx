import Image from 'next/image'
import Link from 'next/link'

export function Logo() {
  return (
    <Link className="wordmark" href="/" style={{ display: 'inline-flex', alignItems: 'center' }}>
<Image src="/logo.png" alt="ClaimClear" width={320} height={92} priority style={{ height: 68, width: 'auto' }} />    </Link>
  )
}