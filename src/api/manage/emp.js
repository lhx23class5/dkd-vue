import request from '@/utils/request'

// 查询工单员工列表
export function listEmp(query) {
  return request({
    url: '/manage/emp/list',
    method: 'get',
    params: query
  })
}

// 查询工单员工详细
export function getEmp(id) {
  return request({
    url: '/manage/emp/' + id,
    method: 'get'
  })
}

// 新增工单员工
export function addEmp(data) {
  return request({
    url: '/manage/emp',
    method: 'post',
    data: data
  })
}

// 修改工单员工
export function updateEmp(data) {
  return request({
    url: '/manage/emp',
    method: 'put',
    data: data
  })
}

// 删除工单员工
export function delEmp(id) {
  return request({
    url: '/manage/emp/' + id,
    method: 'delete'
  })
}
