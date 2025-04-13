import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Company } from '../api/types';
import { companiesApi } from '../api/companies';
import CompanyForm from './CompanyForm';

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await companiesApi.getAll();
      setCompanies(data);
    } catch (error) {
      message.error('Ошибка при загрузке списка компаний');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await companiesApi.delete(id);
      message.success('Компания успешно удалена');
      fetchCompanies();
    } catch (error) {
      message.error('Ошибка при удалении компании');
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalVisible(true);
  };

  const handleCreate = () => {
    setEditingCompany(null);
    setIsModalVisible(true);
  };

  const handleSave = async (values: Partial<Company>) => {
    try {
      if (editingCompany) {
        await companiesApi.update(editingCompany.id, values);
        message.success('Компания успешно обновлена');
      } else {
        await companiesApi.create(values);
        message.success('Компания успешно создана');
      }
      setIsModalVisible(false);
      fetchCompanies();
    } catch (error) {
      message.error('Ошибка при сохранении компании');
    }
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Адрес',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: 'Телефон',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Company) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={handleCreate}
        style={{ marginBottom: 16 }}
      >
        Добавить компанию
      </Button>
      <Table
        loading={loading}
        columns={columns}
        dataSource={companies}
        rowKey="id"
      />
      <Modal
        title={editingCompany ? 'Редактировать компанию' : 'Создать компанию'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <CompanyForm
          initialValues={editingCompany}
          onSubmit={handleSave}
          onCancel={() => setIsModalVisible(false)}
        />
      </Modal>
    </div>
  );
};

export default CompanyList; 