<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryRef" :inline="true" :model="queryParams" label-width="68px">
      <el-form-item label="区域名称" prop="regionName">
        <el-input
            v-model="queryParams.regionName"
            clearable
            placeholder="请输入区域名称"
            @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button icon="Search" type="primary" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:region:add']"
            icon="Plus"
            plain
            type="primary"
            @click="handleAdd"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:region:edit']"
            :disabled="single"
            icon="Edit"
            plain
            type="success"
            @click="handleUpdate"
        >修改
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:region:remove']"
            :disabled="multiple"
            icon="Delete"
            plain
            type="danger"
            @click="handleDelete"
        >删除
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:region:export']"
            icon="Download"
            plain
            type="warning"
            @click="handleExport"
        >导出
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 区域列表 -->
    <el-table v-loading="loading" :data="regionList" @selection-change="handleSelectionChange">
      <el-table-column align="center" type="selection" width="55"/>
      <el-table-column align="center" label="序号" prop="id" type="index" width="50"/>
      <el-table-column align="center" label="区域名称" prop="regionName"/>
      <el-table-column align="center" label="点位数" prop="nodeCount"/>
      <el-table-column align="center" label="备注说明" prop="remark"/>
      <el-table-column align="center" class-name="small-padding fixed-width" label="操作">
        <template #default="scope">
          <el-button v-hasPermi="['manage:node:list']" link type="primary" @click="getRegionInfo(scope.row)">查看详情
          </el-button>
          <el-button v-hasPermi="['manage:region:edit']" link type="primary" @click="handleUpdate(scope.row)">修改
          </el-button>
          <el-button v-hasPermi="['manage:region:remove']" link type="primary" @click="handleDelete(scope.row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
        v-show="total>0"
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNum"
        :total="total"
        @pagination="getList"
    />

    <!-- 添加或修改区域管理对话框 -->
    <el-dialog v-model="open" :title="title" append-to-body width="500px">
      <el-form ref="regionRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="区域名称" prop="regionName">
          <el-input v-model="form.regionName" placeholder="请输入区域名称"/>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入内容" type="textarea"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="regionInfoOpen" append-to-body title="区域详情" width="500px">
      <el-form-item label="区域名称" prop="regionName">
        <el-input v-model="form.regionName" disabled/>
      </el-form-item>
      <label>包含点位：</label>
      <el-table :data="nodeList">
        <el-table-column align="center" label="序号" type="index" width="50"/>
        <el-table-column align="center" label="点位名称" prop="nodeName"/>
        <el-table-column align="center" label="设备数量" prop="deviceCount"/>
      </el-table>
    </el-dialog>
  </div>
</template>

<script name="Region" setup>
import {addRegion, delRegion, getRegion, listRegion, updateRegion} from "@/api/manage/region";
import {listNode} from "@/api/manage/node";
import {loadAllParams} from "@/api/page";

const {proxy} = getCurrentInstance();

const regionList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    regionName: null,
  },
  rules: {
    regionName: [
      {required: true, message: "区域名称不能为空", trigger: "blur"}
    ],
    remark: [
      {required: true, message: "备注不能为空", trigger: "blur"}
    ]
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询区域管理列表 */
function getList() {
  loading.value = true;
  listRegion(queryParams.value).then(response => {
    regionList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    regionName: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null
  };
  proxy.resetForm("regionRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加区域管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getRegion(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改区域管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["regionRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateRegion(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addRegion(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除区域管理编号为"' + _ids + '"的数据项？').then(function () {
    return delRegion(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/region/export', {
    ...queryParams.value
  }, `region_${new Date().getTime()}.xlsx`)
}

/* 查看详情按钮操作 */
const nodeList = ref([]);
const regionInfoOpen = ref(false);

function getRegionInfo(row) {
  // 查询区域信息
  reset();
  const _id = row.id
  getRegion(_id).then(response => {
    form.value = response.data;
  });
  // 查询点位列表
  loadAllParams.regionId = row.id;
  listNode(loadAllParams).then(response => {
    nodeList.value = response.rows;
  });
  regionInfoOpen.value = true;
}

getList();
</script>
