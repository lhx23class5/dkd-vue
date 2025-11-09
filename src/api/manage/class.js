import request from '@/utils/request'

// 查询商品类型列表
export function listClass(query) {
  return request({
    url: '/manage/class/list',
    method: 'get',
    params: query
  })
}

// 查询商品类型详细
export function getClass(classId) {
  return request({
    url: '/manage/class/' + classId,
    method: 'get'
  })
}

// 新增商品类型
export function addClass(data) {
  return request({
    url: '/manage/class',
    method: 'post',
    data: data
  })
}

// 修改商品类型
export function updateClass(data) {
  return request({
    url: '/manage/class',
    method: 'put',
    data: data
  })
}

// 删除商品类型
export function delClass(classId) {
  return request({
    url: '/manage/class/' + classId,
    method: 'delete'
  })
}
