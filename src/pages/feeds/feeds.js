/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import {
  GetLatestFeed,
  GethDAOFeed,
  GetRandomFeed,
  GetFeaturedFeed,
} from '../../data/api'
import { Page, Container, Padding } from '../../components/layout'
import { Loading } from '../../components/loading'

import { ResponsiveMasonry } from '../../components/responsive-masonry'
import { PATH } from '../../constants'
import { Button } from '../../components/button'
import { ItemInfo } from '../../components/item-info'
import { renderMediaType } from '../../components/media-types'
import styles from './styles.module.scss'

const customFloor = function (value, roundTo) {
  return Math.floor(value / roundTo) * roundTo
}

const ONE_MINUTE_MILLIS = 60 * 1000

export const Feeds = ({ type = 0 }) => {
  const [error, setError] = useState(false)
  const [items, setItems] = useState([])
  const [count, setCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const startTime = customFloor(Date.now(), ONE_MINUTE_MILLIS)
  const loadMore = () => {
    setCount(count + 1)
  }

  useEffect(() => {
    if (error) {
      console.log('returning on error')
      return
    }

    if (type === 0) {
      GetLatestFeed({ counter: count, max_time: startTime })
        .then((result) => {
          const next = items.concat(result)
          setItems(next)

          // if original returns less than 10, then there's no more data coming from API
          if (result.length < 10) {
            setHasMore(false)
          }
        })
        .catch((e) => {
          setError(true)
        })
    } else if (type === 1) {
      GethDAOFeed({ counter: count })
        .then((result) => {
          const next = items.concat(result)
          setItems(next)

          // if original returns less than 10, then there's no more data coming from API
          if (result.length < 10) {
            setHasMore(false)
          }
        })
        .catch((e) => {
          setError(true)
        })
    } else if (type === 2) {
      GetRandomFeed({ counter: count })
        .then((result) => {
          // filtered isn't guaranteed to always be 10. if we're filtering they might be less.
          const next = items.concat(result)
          setItems(next)

          // if original returns less than 10, then there's no more data coming from API
          if (result.length < 10) {
            setHasMore(false)
          }
        })
        .catch((e) => {
          setError(true)
        })
    } else if (type === 3) {
      GetFeaturedFeed({ counter: count, max_time: startTime })
        .then((result) => {
          // filtered isn't guaranteed to always be 10. if we're filtering they might be less.
          const next = items.concat(result)
          setItems(next)

          // if original returns less than 10, then there's no more data coming from API
          if (result.length < 10) {
            setHasMore(false)
          }
        })
        .catch((e) => {
          setError(true)
        })
    }
  }, [count, type])

  return (
    <Page title="">
      <InfiniteScroll
        dataLength={items.length}
        next={loadMore}
        hasMore={hasMore}
        scrollThreshold='50%'
        loader={
          <Container xlarge>
            <ResponsiveMasonry>
              <Loading />
            </ResponsiveMasonry>
          </Container>
        }
        endMessage={
          <p>
            mint mint mint{' '}
            <span role="img" aria-labelledby={'Sparkles emoji'}>
              ✨
            </span>
          </p>
        }
      >
        <div>
          <Container xlarge>
            <ResponsiveMasonry>
              {items.map((nft, index) => {
                const { mimeType, uri } = nft.token_info.formats[0]

                return (
                  <Button
                    key={nft.token_id}
                    href={`${PATH.OBJKT}/${nft.token_id}`}
                  >
                    <div className={styles.container2}>
                      {renderMediaType({
                        mimeType,
                        uri: uri.split('//')[1],
                        metadata: nft,
                      })}
                      <div className={styles.number2}>#{nft.token_id}</div>
                    </div>
                  </Button>
                )
              })}
            </ResponsiveMasonry>
          </Container>
        </div>
      </InfiniteScroll>
    </Page >
  )
}
