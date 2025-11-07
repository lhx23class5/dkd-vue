<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-form v-show="showSearch" ref="queryRef" :inline="true" :model="queryParams" label-width="90px">
      <el-form-item label="合作商名称" prop="name">
        <el-input
            v-model="queryParams.partnerName" clearable
            placeholder="请输入合作商名称" @keyup.enter="handleQuery"/>
      </el-form-item>

      <el-form-item>
        <el-button icon="Search" type="primary" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:partner:add']"
            icon="Plus"
            plain
            type="primary"
            @click="handleAdd"
        >新增
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
            v-hasPermi="['manage:partner:edit']"
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
            v-hasPermi="['manage:partner:remove']"
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
            v-hasPermi="['manage:partner:export']"
            icon="Download"
            plain
            type="warning"
            @click="handleExport"
        >导出
        </el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>


    <!-- 合作商列表 -->
    <el-table v-loading="loading" :data="partnerList" @selection-change="handleSelectionChange">
      <el-table-column align="center" type="selection" width="55"/>
      <el-table-column align="center" label="序号" prop="id" type="index" width="50"/>
      <el-table-column align="center" label="合作商名称" prop="partnerName"/>
      <el-table-column align="center" label="点位数" prop="nodeCount" width="80"/>
      <el-table-column align="center" label="账号" prop="account"/>
      <el-table-column align="center" label="分成比例" prop="profitRatio">
        <template #default="scope">{{ scope.row.profitRatio }}%</template>
      </el-table-column>
      <el-table-column align="center" label="联系人" prop="contactPerson"/>
      <el-table-column align="center" label="联系电话" prop="contactPhone"/>
      <el-table-column align="center" class-name="small-padding fixed-width" label="操作">
        <template #default="scope">
          <el-button v-hasPermi="['manage:partner:edit']" link type="primary" @click="resetPwd(scope.row)">
            重置密码
          </el-button>
          <el-button v-hasPermi="['manage:partner:query']" link type="primary" @click="getPartnerInfo(scope.row)">
            查看详情
          </el-button>
          <el-button v-hasPermi="['manage:partner:edit']" link type="primary" @click="handleUpdate(scope.row)">修改
          </el-button>
          <el-button v-hasPermi="['manage:partner:remove']" link type="primary" @click="handleDelete(scope.row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 添加或修改合作商管理对话框 -->
    <el-dialog v-model="open" :title="title" append-to-body width="500px">
      <el-form ref="partnerRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="合作商名称" prop="partnerName">
          <el-input v-model="form.partnerName" placeholder="请输入合作商名称"/>
        </el-form-item>

        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="form.contactPerson" placeholder="请输入联系人"/>
        </el-form-item>

        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="form.contactPhone" placeholder="请输入联系电话"/>
        </el-form-item>

        <el-form-item v-if="form.id!=null" label="创建时间" prop="contactPhone">
          {{ form.createTime }}
        </el-form-item>

        <el-form-item label="分成比例" prop="profitRatio">
          <el-input v-model="form.profitRatio" placeholder="请输入分成比例"/>
        </el-form-item>

        <el-form-item v-if="form.id==null" label="账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入账号"/>
        </el-form-item>

        <el-form-item v-if="form.id==null" label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" type="password"/>
        </el-form-item>

      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>

          <el-button @click="cancel">取 消</el-button>

        </div>

      </template>

    </el-dialog>

    <!-- 查看合作商详情 -->
    <el-dialog v-model="partnerInfoOpen" append-to-body title="合作商详情" width="500px">
      <el-row>
        <el-col :span="12">合作商名称：{{ form.partnerName }}</el-col>
        <el-col :span="12">联系人：{{ form.contactPerson }}</el-col>
      </el-row>
      <el-row>
        <el-col :span="12">联系电话：{{ form.contactPhone }}</el-col>
        <el-col :span="12">分成比例：{{ form.profitRatio }}%</el-col>
      </el-row>
    </el-dialog>

  </div>
</template>

<script name="Partner" setup>
import {addPartner, delPartner, getPartner, listPartner, resetPartnerPwd, updatePartner} from "@/api/manage/partner";

const {proxy} = getCurrentInstance();

const partnerList = ref([]);
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
    partnerName: null,
  },
  rules: {
    partnerName: [
      {required: true, message: "合作商名称不能为空", trigger: "blur"}
    ],
    contactPerson: [
      {required: true, message: "联系人不能为空", trigger: "blur"}
    ],
    contactPhone: [
      {required: true, message: "联系电话不能为空", trigger: "blur"}
    ],
    profitRatio: [
      {required: true, message: "分成比例不能为空", trigger: "blur"}
    ],
    account: [
      {required: true, message: "账号不能为空", trigger: "blur"}
    ],
    password: [
      {required: true, message: "密码不能为空", trigger: "blur"}
    ],
  }
});

const {queryParams, form, rules} = toRefs(data);

/** 查询合作商管理列表 */
function getList() {
  loading.value = true;
  listPartner(queryParams.value).then(response => {
    partnerList.value = response.rows;
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
    partnerName: null,
    contactPerson: null,
    contactPhone: null,
    profitRatio: null,
    account: null,
    password: null,
    createTime: null,
    updateTime: null,
    createBy: null,
    updateBy: null,
    remark: null
  };
  proxy.resetForm("partnerRef");
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
  title.value = "添加合作商管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getPartner(_id).then(response => {
    form.value = response.data;
    open.value = true;
    title.value = "修改合作商管理";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["partnerRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updatePartner(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addPartner(form.value).then(response => {
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
  proxy.$modal.confirm('是否确认删除合作商管理编号为"' + _ids + '"的数据项？').then(function () {
    return delPartner(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => {
  });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('manage/partner/export', {
    ...queryParams.value
  }, `partner_${new Date().getTime()}.xlsx`)
}


/* 查看合作商详情 */
const partnerInfoOpen = ref(false);

function getPartnerInfo(row) {
  reset();
  const _id = row.id;
  getPartner(_id).then(response => {
    form.value = response.data;
    partnerInfoOpen.value = true;
  });
}

/* 重置合作商密码 */
function resetPwd(row) {
  const _id = row.id;
  proxy.$modal.confirm('你确定要重置该合作商密码吗？').then(function () {
    return resetPartnerPwd(_id);
  }).then(() => {
    proxy.$modal.msgSuccess("重置成功");
  }).catch(() => {
  });
}

getList();
</script>
