import type { TagsBase } from '../../../storage/BaseRecord'
import type { Constructable } from '../../../utils/mixins'
import type { SdJwtVc } from '../SdJwtVcService'
import type { SdJwtVcTypeMetadata } from '../typeMetadata'

import { decodeSdJwtSync } from '@sd-jwt/decode'

import { Hasher } from '../../../crypto'
import { BaseRecord } from '../../../storage/BaseRecord'
import { JsonTransformer } from '../../../utils'
import { uuid } from '../../../utils/uuid'
import { KnownJwaSignatureAlgorithm } from '../../kms'
import { decodeSdJwtVc } from '../decodeSdJwtVc'

export type DefaultSdJwtVcRecordTags = {
  vct: string

  /**
   * The sdAlg is the alg used for creating digests for selective disclosures
   */
  sdAlg: string

  /**
   * The alg is the alg used to sign the SD-JWT
   */
  alg: KnownJwaSignatureAlgorithm
}

export type SdJwtVcRecordStorageProps = {
  id?: string
  createdAt?: Date
  tags?: TagsBase
  compactSdJwtVc: string

  typeMetadata?: SdJwtVcTypeMetadata
}

export class SdJwtVcRecord extends BaseRecord<DefaultSdJwtVcRecordTags> {
  public static readonly type = 'SdJwtVcRecord'
  public readonly type = SdJwtVcRecord.type

  // We store the sdJwtVc in compact format.
  public compactSdJwtVc!: string

  public typeMetadata?: SdJwtVcTypeMetadata

  public constructor(props: SdJwtVcRecordStorageProps) {
    super()

    if (props) {
      this.id = props.id ?? uuid()
      this.createdAt = props.createdAt ?? new Date()
      this.compactSdJwtVc = props.compactSdJwtVc
      this.typeMetadata = props.typeMetadata
      this._tags = props.tags ?? {}
    }
  }

  public get sdJwtVc(): SdJwtVc {
    return decodeSdJwtVc(this.compactSdJwtVc, this.typeMetadata)
  }

  public getTags() {
    const sdjwt = decodeSdJwtSync(this.compactSdJwtVc, Hasher.hash)
    const vct = sdjwt.jwt.payload.vct as string
    const sdAlg = sdjwt.jwt.payload._sd_alg as string | undefined
    const alg = sdjwt.jwt.header.alg as KnownJwaSignatureAlgorithm

    return {
      ...this._tags,
      vct,
      sdAlg: sdAlg ?? 'sha-256',
      alg,
    }
  }

  public clone(): this {
    return JsonTransformer.fromJSON(JsonTransformer.toJSON(this), this.constructor as Constructable<this>)
  }

  /**
   * credential is convenience method added to all credential records
   */
  public get credential(): SdJwtVc {
    return decodeSdJwtVc(this.compactSdJwtVc, this.typeMetadata)
  }

  /**
   * encoded is convenience method added to all credential records
   */
  public get encoded(): string {
    return this.compactSdJwtVc
  }
}
