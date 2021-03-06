/* eslint-env mocha */
import assert from 'assert'
import sinon from 'sinon'
import * as fetch from '../../fetch'
import { createDocumentAction, createDocumentsAction } from '..'

describe('Create Document Action', () => {
  let dispatch, spy, fetchSingle, fetchMultiple // eslint-disable-line
  const sampleError = new Error('error')

  before(() => {
    fetchMultiple = sinon.stub(fetch, 'fetchDocuments').callsFake(() => {
      return Promise.resolve([{ foo: 'bar' }, { foo: 'baz' }])
    })

    fetchSingle = sinon.stub(fetch, 'fetchDocument').callsFake(() => {
      return Promise.resolve({ foo: 'bar' })
    })

    dispatch = (action) => {
      spy = sinon.spy()
      const getState = () => ({ prismic: { token: 'STORE_TOKEN' } })
      return action(spy, getState)
    }
  })

  it('should create us a simple action creator', () => {
    const actionCreator = createDocumentAction('page')
    assert.equal(typeof actionCreator, 'function')
  })

  it('should resolve to the fetched data', (done) => {
    dispatch(createDocumentAction('page'))
      .then((data) => {
        assert.equal(data.foo, 'bar')
        done()
      })
  })

  it('should dispatch two actions', (done) => {
    dispatch(createDocumentAction('page'))
      .then(() => {
        assert.equal(spy.callCount, 2)
        done()
      })
  })

  it('should dispatch a fetching action', (done) => {
    dispatch(createDocumentAction('page'))
      .then((data) => {
        const action = spy.firstCall.args[0]
        assert.equal(action.type, 'page/FETCH')
        done()
      })
  })

  it('should dispatch a fetched action', (done) => {
    dispatch(createDocumentAction('page'))
      .then((data) => {
        const action = spy.secondCall.args[0]
        assert.equal(action.type, 'page/FETCH_SUCCESS')
        assert.deepEqual(action.payload.data, { foo: 'bar' })
        done()
      })
  })

  it('should propogate errors correctly', (done) => {
    fetchSingle.restore()

    sinon.stub(fetch, 'fetchDocument').callsFake(() => {
      return Promise.reject(sampleError)
    })

    dispatch(createDocumentAction('page'))
      .catch((error) => {
        assert.deepEqual(error, sampleError)
        done()
      })
  })

  it('should dispatch an failure action', (done) => {
    fetchSingle.restore()

    sinon.stub(fetch, 'fetchDocument').callsFake(() => {
      return Promise.reject(sampleError)
    })

    dispatch(createDocumentAction('page'))
      .catch(() => {
        const action = spy.secondCall.args[0]
        assert.equal(action.type, 'page/FETCH_FAILURE')
        assert.deepEqual(action.payload.error, sampleError)
        done()
      })
  })

  it('should dispatch an action for multiple docs', (done) => {
    dispatch(createDocumentsAction('page'))
      .then((data) => {
        const action = spy.secondCall.args[0]
        assert.equal(action.type, 'page/FETCH_SUCCESS')
        assert.equal(action.payload.data.length, 2)
        assert.deepEqual(action.payload.data[0], { foo: 'bar' })
        assert.deepEqual(action.payload.data[1], { foo: 'baz' })
        done()
      })
  })

  it('will pass in a basic API token', (done) => {
    fetchSingle.restore()
    const fetchStub = sinon.stub(fetch, 'fetchDocument').callsFake(() => {
      return Promise.resolve({})
    })

    dispatch(createDocumentAction('page', { token: 'STRING_TOKEN' }))
      .then((data) => {
        const args = fetchStub.firstCall.args[0]
        assert.equal(args.token, 'STRING_TOKEN')
        done()
      })
  })

  it('will grab a token out of the store', (done) => {
    fetchSingle.restore()
    const fetchStub = sinon.stub(fetch, 'fetchDocument').callsFake(() => {
      return Promise.resolve({})
    })

    dispatch(createDocumentAction('page', { token: (state) => state.prismic.token }))
      .then((data) => {
        const args = fetchStub.firstCall.args[0]
        assert.equal(args.token, 'STORE_TOKEN')
        done()
      })
  })
})
